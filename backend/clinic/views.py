from django.db import transaction
from django.db.models import Count,Sum,F,Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from rest_framework import viewsets,status
from rest_framework.decorators import action,api_view,permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter,OrderingFilter
from .models import (Student,Medication,Visit,Prescription,LabRequest,Immunization,AuditEntry)
from .serializers import (StudentSerializer,StudentBriefSerializer,MedicationSerializer,
    VisitReadSerializer,NurseVisitSerializer,DoctorVisitSerializer,PrescriptionSerializer,
    LabRequestSerializer,ImmunizationSerializer,AuditEntrySerializer,UserSerializer,
    UserCreateSerializer,UserUpdateSerializer,PasswordResetSerializer,PasswordChangeSerializer)
from .pagination import EnvelopePagination
from .permissions import IsAdmin,RoleGate,VisitObjectPermission,user_role

class BaseViewSet(viewsets.ModelViewSet):
    pagination_class=EnvelopePagination
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    permission_classes=[IsAuthenticated,RoleGate]
    def perform_create(self,serializer): serializer.save(created_by=self.request.user)
    def perform_destroy(self,instance): instance.soft_delete(user=self.request.user)
    @action(detail=True,methods=['post'],url_path='restore')
    def restore(self,request,pk=None):
        m=self.get_queryset().model.all_objects.filter(pk=pk).first()
        if not m: return Response({'error':'Not found'},status=404)
        m.restore(); return Response({'ok':True})
    @action(detail=True,methods=['delete'],url_path='purge')
    def purge(self,request,pk=None):
        if user_role(request.user)!='admin':
            return Response({'error':'Admin only'},status=403)
        qs=self.get_queryset().model.all_objects.filter(pk=pk)
        if not qs.exists(): return Response({'error':'Not found'},status=404)
        qs.hard_delete(); return Response({'ok':True})

class StudentViewSet(BaseViewSet):
    queryset=Student.objects.all()
    serializer_class=StudentSerializer
    search_fields=['first_name','last_name','student_id','department','faculty','email','phone']
    filterset_fields={'faculty':['exact'],'level':['exact'],'gender':['exact'],
        'blood_group':['exact'],'registered_at':['gte','lte']}
    ordering_fields=['last_name','first_name','registered_at','level']
    ordering=['last_name','first_name']
    read_roles=['doctor','nurse','pharmacist','receptionist']
    create_roles=['receptionist']
    update_roles=['doctor','receptionist']
    delete_roles=['receptionist']

    @action(detail=False,methods=['get'])
    def lookup(self,request):
        """Compact list for typeahead pickers. Never returns more than 20."""
        q=(request.query_params.get('q') or '').strip()
        qs=Student.objects.all()
        if q:
            qs=qs.filter(Q(first_name__icontains=q)|Q(last_name__icontains=q)|
                         Q(student_id__icontains=q)|Q(email__icontains=q))
        qs=qs.order_by('last_name','first_name')[:20]
        return Response([{
            'id':str(s.id),'studentId':s.student_id,
            'firstName':s.first_name,'lastName':s.last_name,
            'department':s.department,'faculty':s.faculty,'level':s.level,
        } for s in qs])

    @action(detail=True,methods=['get'])
    def profile(self,request,pk=None):
        """Student + complete history in one round-trip."""
        student=self.get_object()
        visits=Visit.objects.filter(student=student).order_by('-date','-time')
        prescriptions=(Prescription.objects.filter(student=student)
                       .select_related('medication','visit').order_by('-created_at'))
        immunizations=Immunization.objects.filter(student=student).order_by('-date')
        labs=LabRequest.objects.filter(student=student).order_by('-ordered_at')
        return Response({
            'student':StudentSerializer(student).data,
            'visits':VisitReadSerializer(visits,many=True).data,
            'prescriptions':PrescriptionSerializer(prescriptions,many=True).data,
            'immunizations':ImmunizationSerializer(immunizations,many=True).data,
            'lab_requests':LabRequestSerializer(labs,many=True).data,
        })

class MedicationViewSet(BaseViewSet):
    queryset=Medication.objects.all()
    serializer_class=MedicationSerializer
    search_fields=['name','category','batch_no','supplier','location']
    filterset_fields={'category':['exact'],'quantity':['gte','lte'],'expiry_date':['gte','lte','isnull']}
    ordering_fields=['name','quantity','expiry_date','unit_cost']
    ordering=['name']
    read_roles=None
    create_roles=['pharmacist']
    update_roles=['pharmacist']
    delete_roles=['pharmacist']
    action_roles={'restock':['pharmacist']}
    @action(detail=True,methods=['post'])
    def restock(self,request,pk=None):
        med=self.get_object()
        try: qty=int(request.data.get('quantity',0))
        except (TypeError,ValueError): return Response({'error':'Invalid quantity'},status=400)
        if qty<1: return Response({'error':'Quantity must be at least 1'},status=400)
        med.quantity+=qty
        for f,k in [('batch_no','batchNo'),('expiry_date','expiryDate'),
                    ('supplier','supplier'),('unit_cost','unitCost')]:
            if request.data.get(k): setattr(med,f,request.data[k])
        med.save(); return Response(MedicationSerializer(med).data)

class VisitViewSet(BaseViewSet):
    queryset=Visit.objects.select_related('student').all()
    search_fields=['diagnosis','complaint','attending','student__first_name','student__last_name']
    filterset_fields={'status':['exact'],'student':['exact'],'date':['exact','gte','lte']}
    ordering_fields=['date','created_at','status']
    ordering=['-date','-time']
    read_roles=None
    create_roles=['nurse']
    update_roles=['nurse','doctor']
    delete_roles=[]
    def get_permissions(self):
        p=super().get_permissions()
        if self.action in ('update','partial_update'): p.append(VisitObjectPermission())
        return p
    def get_serializer_class(self):
        if self.action in ('create','update','partial_update'):
            role=user_role(self.request.user)
            if role=='nurse': return NurseVisitSerializer
            if role=='doctor': return DoctorVisitSerializer
            return NurseVisitSerializer
        return VisitReadSerializer
    def create(self,request,*a,**kw):
        role=user_role(request.user)
        if role not in ('nurse','admin'):
            return Response({'error':'Only nurses can create visits.'},status=403)
        return super().create(request,*a,**kw)
    def update(self,request,*a,**kw):
        v=self.get_object()
        role=user_role(request.user)
        if role not in ('nurse','doctor','admin'):
            return Response({'error':'Not permitted.'},status=403)
        if role!='admin' and v.status!='awaiting_doctor':
            return Response({'error':'This visit is closed.'},status=400)
        return super().update(request,*a,**kw)

class PrescriptionViewSet(BaseViewSet):
    queryset=Prescription.objects.select_related('student','medication','visit').all()
    serializer_class=PrescriptionSerializer
    search_fields=['student__first_name','student__last_name','medication__name']
    filterset_fields={'status':['exact'],'student':['exact'],'visit':['exact'],'created_at':['gte','lte']}
    ordering=['-created_at']
    read_roles=None
    create_roles=['doctor']
    update_roles=['doctor']
    delete_roles=[]
    action_roles={'dispense':['pharmacist'],'cancel_rx':['pharmacist','doctor']}
    @action(detail=True,methods=['post'])
    def dispense(self,request,pk=None):
        rx=self.get_object()
        if rx.status!='pending':
            return Response({'error':'Prescription is not pending'},status=400)
        try: qty=int(request.data.get('quantity',rx.quantity))
        except (TypeError,ValueError): return Response({'error':'Invalid quantity'},status=400)
        if qty<1: return Response({'error':'Quantity must be at least 1'},status=400)
        with transaction.atomic():
            med=Medication.objects.select_for_update().get(pk=rx.medication_id)
            if med.quantity<qty:
                return Response({'error':f'Insufficient stock. Available: {med.quantity}'},status=400)
            med.quantity-=qty; med.save(update_fields=['quantity'])
            rx.quantity=qty; rx.status='dispensed'; rx.dispensed_at=timezone.now()
            rx.dispensed_by=request.data.get('dispensedBy') or request.user.get_full_name() or request.user.username
            rx.save()
        return Response(PrescriptionSerializer(rx).data)
    @action(detail=True,methods=['post'])
    def cancel_rx(self,request,pk=None):
        rx=self.get_object()
        if rx.status=='dispensed':
            return Response({'error':'Cannot cancel a dispensed prescription'},status=400)
        rx.status='cancelled'; rx.save(update_fields=['status'])
        return Response(PrescriptionSerializer(rx).data)

class LabRequestViewSet(BaseViewSet):
    queryset=LabRequest.objects.select_related('student','visit').all()
    serializer_class=LabRequestSerializer
    search_fields=['test_type','ordered_by','student__first_name','student__last_name']
    filterset_fields={'status':['exact'],'student':['exact'],'ordered_at':['gte','lte']}
    ordering=['-ordered_at']
    read_roles=None
    create_roles=['doctor','nurse']
    update_roles=['doctor','nurse']
    delete_roles=[]

class ImmunizationViewSet(BaseViewSet):
    queryset=Immunization.objects.select_related('student').all()
    serializer_class=ImmunizationSerializer
    search_fields=['vaccine','given_by','student__first_name','student__last_name']
    filterset_fields={'student':['exact'],'vaccine':['exact','icontains'],'date':['gte','lte']}
    ordering=['-date']
    read_roles=None
    create_roles=['nurse','doctor']
    update_roles=['nurse','doctor']
    delete_roles=[]

class AuditEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset=AuditEntry.objects.select_related('actor').all()
    serializer_class=AuditEntrySerializer
    pagination_class=EnvelopePagination
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    search_fields=['actor_label','action','model','target_label']
    filterset_fields={'action':['exact'],'model':['exact'],'at':['gte','lte']}
    ordering=['-at']
    permission_classes=[IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
    queryset=User.objects.prefetch_related('groups').all()
    pagination_class=EnvelopePagination
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    search_fields=['username','email','first_name','last_name']
    ordering=['username']
    def get_permissions(self):
        if self.action=='change_password': return [IsAuthenticated()]
        return [IsAuthenticated(),IsAdmin()]
    def get_serializer_class(self):
        if self.action=='create': return UserCreateSerializer
        if self.action in ('update','partial_update'): return UserUpdateSerializer
        return UserSerializer
    @action(detail=True,methods=['post'],permission_classes=[IsAuthenticated,IsAdmin])
    def reset_password(self,request,pk=None):
        u=self.get_object()
        s=PasswordResetSerializer(data=request.data); s.is_valid(raise_exception=True)
        u.set_password(s.validated_data['new_password']); u.save()
        return Response({'ok':True,'message':f'Password reset for {u.username}.'})
    @action(detail=True,methods=['post'],permission_classes=[IsAuthenticated,IsAdmin])
    def toggle_active(self,request,pk=None):
        u=self.get_object()
        if u==request.user: return Response({'error':'Cannot deactivate yourself'},status=400)
        u.is_active=not u.is_active; u.save()
        return Response(UserSerializer(u).data)
    @action(detail=False,methods=['post'],permission_classes=[IsAuthenticated])
    def change_password(self,request):
        s=PasswordChangeSerializer(data=request.data,context={'request':request})
        s.is_valid(raise_exception=True)
        request.user.set_password(s.validated_data['new_password']); request.user.save()
        return Response({'ok':True})

TRASH={'student':(Student,StudentSerializer),'medication':(Medication,MedicationSerializer),
    'visit':(Visit,VisitReadSerializer),'prescription':(Prescription,PrescriptionSerializer),
    'lab':(LabRequest,LabRequestSerializer),'immunization':(Immunization,ImmunizationSerializer)}
class TrashViewSet(viewsets.ViewSet):
    permission_classes=[IsAuthenticated,IsAdmin]
    def list(self,request):
        rows=[]
        for k,(M,_) in TRASH.items():
            for r in M.all_objects.filter(is_deleted=True)[:200]:
                rows.append({'kind':k,'id':str(r.pk),'label':str(r)[:120],
                    'deleted_at':r.deleted_at,
                    'deleted_by':r.deleted_by.get_username() if r.deleted_by else None})
        rows.sort(key=lambda x:x['deleted_at'] or '',reverse=True)
        return Response({'count':len(rows),'results':rows,'page':1,'pages':1,'page_size':len(rows)})
    @action(detail=False,methods=['post'],url_path='restore')
    def restore(self,request):
        kind=request.data.get('kind'); pk=request.data.get('id')
        e=TRASH.get(kind)
        if not e: return Response({'error':'Unknown kind'},status=400)
        row=e[0].all_objects.filter(pk=pk).first()
        if not row: return Response({'error':'Not found'},status=404)
        row.restore(); return Response({'ok':True})
    @action(detail=False,methods=['post'],url_path='purge')
    def purge(self,request):
        kind=request.data.get('kind'); pk=request.data.get('id')
        e=TRASH.get(kind)
        if not e: return Response({'error':'Unknown kind'},status=400)
        qs=e[0].all_objects.filter(pk=pk)
        if not qs.exists(): return Response({'error':'Not found'},status=404)
        qs.hard_delete(); return Response({'ok':True})

class ReportsViewSet(viewsets.ViewSet):
    permission_classes=[IsAuthenticated,RoleGate]
    read_roles=['doctor']
    @action(detail=False,methods=['get'],url_path='overview')
    def overview(self,request):
        df=request.query_params.get('from'); dt=request.query_params.get('to')
        vq=Visit.objects.all(); rq=Prescription.objects.all()
        if df: vq=vq.filter(date__gte=df); rq=rq.filter(created_at__date__gte=df)
        if dt: vq=vq.filter(date__lte=dt); rq=rq.filter(created_at__date__lte=dt)
        bf=list(vq.values(label=F('student__faculty')).annotate(value=Count('id')).order_by('-value'))
        td=list(vq.exclude(diagnosis='').values(label=F('diagnosis')).annotate(value=Count('id')).order_by('-value')[:8])
        mm=list(rq.filter(status='dispensed').values(label=F('medication__name'),strength=F('medication__strength')).annotate(value=Sum('quantity')).order_by('-value')[:8])
        mn=list(vq.annotate(m=TruncMonth('date')).values('m').annotate(value=Count('id')).order_by('m').values('m','value'))
        iv=Medication.objects.aggregate(v=Sum(F('quantity')*F('unit_cost')))['v'] or 0
        return Response({
            'by_faculty':[{'label':x['label'] or 'Unknown','value':x['value']} for x in bf],
            'top_diagnoses':[{'label':x['label'],'value':x['value']} for x in td],
            'medications_dispensed':[{'label':f"{x['label']} {x['strength']}".strip(),'value':x['value']} for x in mm],
            'monthly_visits':[{'label':x['m'].strftime('%Y-%m'),'value':x['value']} for x in mn],
            'kpis':{'total_visits':vq.count(),'unique_patients':vq.values('student').distinct().count(),
                'total_prescriptions':rq.count(),'dispensed_prescriptions':rq.filter(status='dispensed').count(),
                'inventory_value':float(iv)}})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today=timezone.now().date()
    week_ago=today-timedelta(days=6)
    counts={}
    for i in range(7):
        d=week_ago+timedelta(days=i); counts[d.isoformat()]=0
    for row in Visit.objects.filter(date__gte=week_ago).values('date'):
        k=row['date'].isoformat(); counts[k]=counts.get(k,0)+1
    recent=Visit.objects.select_related('student').order_by('-date','-time')[:8]
    low=Medication.objects.filter(quantity__lte=F('reorder_level'))[:6]
    return Response({
        'student_count':Student.objects.count(),
        'visits_today':Visit.objects.filter(date=today).count(),
        'awaiting_doctor':Visit.objects.filter(status='awaiting_doctor').count(),
        'pending_prescriptions':Prescription.objects.filter(status='pending').count(),
        'low_stock_count':Medication.objects.filter(quantity__lte=F('reorder_level')).count(),
        'rx_status':{
            'dispensed':Prescription.objects.filter(status='dispensed').count(),
            'pending':Prescription.objects.filter(status='pending').count(),
            'cancelled':Prescription.objects.filter(status='cancelled').count()},
        'visits_by_day':[{'label':k,'value':v} for k,v in counts.items()],
        'recent_visits':VisitReadSerializer(recent,many=True).data,
        'low_stock_items':MedicationSerializer(low,many=True).data})
