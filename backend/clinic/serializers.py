from django.contrib.auth.models import User,Group
from rest_framework import serializers
from .models import (Student,Medication,Visit,Prescription,LabRequest,Immunization,AuditEntry)
ALLERGY={
 'penicillin':['penicillin','amoxicillin','ampicillin','augmentin','amoxil','piperacillin'],
 'amoxicillin':['penicillin','amoxicillin','ampicillin','augmentin'],
 'sulfa':['sulfamethoxazole','cotrimoxazole','septra','bactrim','sulfadiazine'],
 'sulfa drugs':['sulfamethoxazole','cotrimoxazole','septra','bactrim'],
 'aspirin':['aspirin','ibuprofen','diclofenac','naproxen','indomethacin'],
 'nsaid':['aspirin','ibuprofen','diclofenac','naproxen'],
 'ibuprofen':['aspirin','ibuprofen','diclofenac']}
def _match(med,alg):
    n=med.lower();a=alg.lower().strip()
    if a in n: return True
    return any(x in n for x in ALLERGY.get(a,[]))

class StudentBriefSerializer(serializers.ModelSerializer):
    """Compact student payload — embedded in visit/rx/lab responses."""
    studentId=serializers.CharField(source='student_id')
    firstName=serializers.CharField(source='first_name')
    lastName=serializers.CharField(source='last_name')
    class Meta:
        model=Student
        fields=['id','studentId','firstName','lastName','department','faculty','level']

class StudentSerializer(serializers.ModelSerializer):
    studentId=serializers.CharField(source='student_id')
    firstName=serializers.CharField(source='first_name')
    lastName=serializers.CharField(source='last_name')
    bloodGroup=serializers.CharField(source='blood_group',required=False,allow_blank=True)
    registeredAt=serializers.DateField(source='registered_at',read_only=True)
    emergency=serializers.SerializerMethodField()
    class Meta:
        model=Student
        fields=['id','studentId','firstName','lastName','dob','gender','faculty','department',
                'level','phone','email','bloodGroup','genotype','allergies','conditions',
                'emergency','registeredAt']
    def get_emergency(self,o):
        return {'name':o.emergency_name,'phone':o.emergency_phone,'relation':o.emergency_relation}
    def _em(self,v):
        em=self.initial_data.get('emergency') or {}
        v.update(emergency_name=em.get('name',''),emergency_phone=em.get('phone',''),
                 emergency_relation=em.get('relation',''))
        return v
    def create(self,v): return super().create(self._em(v))
    def update(self,i,v): return super().update(i,self._em(v))

class MedicationSerializer(serializers.ModelSerializer):
    reorderLevel=serializers.IntegerField(source='reorder_level',required=False)
    batchNo=serializers.CharField(source='batch_no',required=False,allow_blank=True)
    expiryDate=serializers.DateField(source='expiry_date',required=False,allow_null=True)
    unitCost=serializers.DecimalField(source='unit_cost',max_digits=10,decimal_places=2,required=False)
    isExpired=serializers.BooleanField(source='is_expired',read_only=True)
    isLow=serializers.BooleanField(source='is_low',read_only=True)
    class Meta:
        model=Medication
        fields=['id','name','strength','form','category','unit','quantity','reorderLevel',
                'batchNo','expiryDate','supplier','unitCost','location','isExpired','isLow']

class VisitReadSerializer(serializers.ModelSerializer):
    studentId=serializers.PrimaryKeyRelatedField(source='student',read_only=True)
    student=StudentBriefSerializer(read_only=True)
    vitals=serializers.SerializerMethodField()
    class Meta:
        model=Visit
        fields=['id','studentId','student','date','time','complaint','diagnosis','treatment',
                'notes','vitals','attending','status','created_at']
    def get_vitals(self,o):
        return {'bp':o.vitals_bp,'temp':o.vitals_temp,'pulse':o.vitals_pulse,
                'weight':o.vitals_weight,'spo2':o.vitals_spo2}

class NurseVisitSerializer(serializers.ModelSerializer):
    studentId=serializers.PrimaryKeyRelatedField(source='student',queryset=Student.objects.all())
    vitals=serializers.DictField(write_only=True,required=False)
    class Meta:
        model=Visit
        fields=['id','studentId','date','time','complaint','attending','vitals']
    def _v(self,v):
        x=v.pop('vitals',{}) or {}
        v.update(vitals_bp=x.get('bp',''),vitals_temp=x.get('temp',''),
                 vitals_pulse=x.get('pulse',''),vitals_weight=x.get('weight',''),
                 vitals_spo2=x.get('spo2',''))
        return v
    def create(self,v):
        v=self._v(v); v['status']='awaiting_doctor'
        v['diagnosis']=''; v['treatment']=''; v['notes']=''
        return super().create(v)
    def update(self,i,v):
        if i.status!='awaiting_doctor':
            raise serializers.ValidationError('This visit has already been seen by a doctor.')
        v=self._v(v)
        for f in ('status','diagnosis','treatment','notes'): v.pop(f,None)
        return super().update(i,v)

class DoctorVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model=Visit
        fields=['id','diagnosis','treatment','notes','status']
    def validate_status(self,value):
        if value not in ('completed','referred'):
            raise serializers.ValidationError('Doctor may only set status to completed or referred.')
        return value
    def validate_diagnosis(self,value):
        if not value or not value.strip():
            raise serializers.ValidationError('Diagnosis is required.')
        return value.strip()

class PrescriptionSerializer(serializers.ModelSerializer):
    visitId=serializers.PrimaryKeyRelatedField(source='visit',queryset=Visit.objects.all())
    studentId=serializers.PrimaryKeyRelatedField(source='student',queryset=Student.objects.all())
    medicationId=serializers.PrimaryKeyRelatedField(source='medication',queryset=Medication.objects.all())
    student=StudentBriefSerializer(read_only=True)
    prescribedBy=serializers.CharField(source='prescribed_by',required=False,allow_blank=True)
    dispensedAt=serializers.DateTimeField(source='dispensed_at',read_only=True)
    dispensedBy=serializers.CharField(source='dispensed_by',read_only=True)
    class Meta:
        model=Prescription
        fields=['id','visitId','studentId','student','medicationId','dosage','frequency','duration',
                'quantity','status','prescribedBy','dispensedAt','dispensedBy']
    def validate(self,attrs):
        visit=attrs.get('visit')
        student=attrs.get('student') or (self.instance.student if self.instance else None)
        med=attrs.get('medication') or (self.instance.medication if self.instance else None)
        if visit and not self.instance and visit.status!='awaiting_doctor':
            raise serializers.ValidationError({'visitId':'Cannot prescribe on a visit that is not in progress.'})
        if student and med and student.allergies:
            for a in student.allergies:
                if _match(med.name,a):
                    raise serializers.ValidationError({'medicationId':
                        f'Allergy alert: {student.first_name} {student.last_name} is allergic to "{a}". {med.name} may cross-react.'})
        return attrs

class LabRequestSerializer(serializers.ModelSerializer):
    studentId=serializers.PrimaryKeyRelatedField(source='student',queryset=Student.objects.all())
    visitId=serializers.PrimaryKeyRelatedField(source='visit',queryset=Visit.objects.all(),
        required=False,allow_null=True)
    student=StudentBriefSerializer(read_only=True)
    testType=serializers.CharField(source='test_type')
    orderedBy=serializers.CharField(source='ordered_by',required=False,allow_blank=True)
    orderedAt=serializers.DateField(source='ordered_at',required=False)
    reviewedBy=serializers.CharField(source='reviewed_by',required=False,allow_blank=True)
    class Meta:
        model=LabRequest
        fields=['id','studentId','student','visitId','testType','orderedBy','orderedAt','status',
                'result','reviewedBy','notes']

class ImmunizationSerializer(serializers.ModelSerializer):
    studentId=serializers.PrimaryKeyRelatedField(source='student',queryset=Student.objects.all())
    givenBy=serializers.CharField(source='given_by',required=False,allow_blank=True)
    batchNo=serializers.CharField(source='batch_no',required=False,allow_blank=True)
    class Meta:
        model=Immunization
        fields=['id','studentId','vaccine','dose','date','givenBy','batchNo']

class AuditEntrySerializer(serializers.ModelSerializer):
    actorLabel=serializers.CharField(source='actor_label')
    targetLabel=serializers.CharField(source='target_label')
    targetId=serializers.CharField(source='target_id')
    class Meta:
        model=AuditEntry
        fields=['id','at','actorLabel','action','model','targetId','targetLabel','details']

class UserSerializer(serializers.ModelSerializer):
    role=serializers.SerializerMethodField();name=serializers.SerializerMethodField()
    class Meta:
        model=User
        fields=['id','username','email','first_name','last_name','is_active','role','name','date_joined']
        read_only_fields=['date_joined']
    def get_role(self,o):
        g=o.groups.first()
        return g.name.lower() if g else ('admin' if o.is_superuser else '')
    def get_name(self,o): return o.get_full_name() or o.username

class UserCreateSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True,min_length=8)
    role=serializers.ChoiceField(choices=['admin','doctor','nurse','pharmacist','receptionist'],write_only=True)
    class Meta:
        model=User
        fields=['id','username','email','first_name','last_name','is_active','password','role']
    def validate_username(self,value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value
    def create(self,v):
        role=v.pop('role');pw=v.pop('password')
        u=User.objects.create_user(password=pw,**v)
        u.groups.set([Group.objects.get(name=role)])
        if role=='admin': u.is_staff=True
        u.save();return u

class UserUpdateSerializer(serializers.ModelSerializer):
    role=serializers.ChoiceField(choices=['admin','doctor','nurse','pharmacist','receptionist'],required=False)
    class Meta:
        model=User
        fields=['id','email','first_name','last_name','is_active','role']
    def update(self,i,v):
        role=v.pop('role',None)
        u=super().update(i,v)
        if role:
            u.groups.set([Group.objects.get(name=role)]);u.is_staff=(role=='admin');u.save()
        return u

class PasswordResetSerializer(serializers.Serializer):
    new_password=serializers.CharField(min_length=8)
class PasswordChangeSerializer(serializers.Serializer):
    current_password=serializers.CharField()
    new_password=serializers.CharField(min_length=8)
    def validate_current_password(self,value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
