import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from .managers import SoftDeleteManager,AllObjectsManager

class SoftDeleteModel(models.Model):
    is_deleted=models.BooleanField(default=False,db_index=True)
    deleted_at=models.DateTimeField(null=True,blank=True)
    deleted_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    objects=SoftDeleteManager()
    all_objects=AllObjectsManager()
    class Meta: abstract=True
    def soft_delete(self,user=None):
        self.is_deleted=True; self.deleted_at=timezone.now()
        if user and user.is_authenticated: self.deleted_by=user
        self.save(update_fields=['is_deleted','deleted_at','deleted_by'])
    def restore(self):
        self.is_deleted=False; self.deleted_at=None; self.deleted_by=None
        self.save(update_fields=['is_deleted','deleted_at','deleted_by'])

class Student(SoftDeleteModel):
    GENDER=[('Female','Female'),('Male','Male'),('Other','Other')]
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    student_id=models.CharField(max_length=50,unique=True,db_index=True)
    first_name=models.CharField(max_length=100)
    last_name=models.CharField(max_length=100,db_index=True)
    dob=models.DateField(null=True,blank=True)
    gender=models.CharField(max_length=10,choices=GENDER,default='Female')
    faculty=models.CharField(max_length=100,blank=True,db_index=True)
    department=models.CharField(max_length=100,blank=True)
    level=models.CharField(max_length=20,blank=True)
    phone=models.CharField(max_length=30,blank=True)
    email=models.EmailField(blank=True)
    blood_group=models.CharField(max_length=5,blank=True)
    genotype=models.CharField(max_length=5,blank=True)
    allergies=models.JSONField(default=list,blank=True)
    conditions=models.JSONField(default=list,blank=True)
    emergency_name=models.CharField(max_length=100,blank=True)
    emergency_phone=models.CharField(max_length=30,blank=True)
    emergency_relation=models.CharField(max_length=50,blank=True)
    registered_at=models.DateField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['last_name','first_name']
    def __str__(self): return f"{self.first_name} {self.last_name} ({self.student_id})"

class Medication(SoftDeleteModel):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    name=models.CharField(max_length=150,db_index=True)
    strength=models.CharField(max_length=50,blank=True)
    form=models.CharField(max_length=50,blank=True)
    category=models.CharField(max_length=80,blank=True,db_index=True)
    unit=models.CharField(max_length=30,default='units')
    quantity=models.PositiveIntegerField(default=0)
    reorder_level=models.PositiveIntegerField(default=0)
    batch_no=models.CharField(max_length=60,blank=True)
    expiry_date=models.DateField(null=True,blank=True)
    supplier=models.CharField(max_length=150,blank=True)
    unit_cost=models.DecimalField(max_digits=10,decimal_places=2,default=0)
    location=models.CharField(max_length=80,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['name']
    @property
    def is_expired(self): return bool(self.expiry_date and self.expiry_date<timezone.now().date())
    @property
    def is_low(self): return self.quantity<=self.reorder_level
    def __str__(self): return f"{self.name} {self.strength}"

class Visit(SoftDeleteModel):
    STATUS=[('awaiting_doctor','Awaiting doctor'),('completed','Completed'),('referred','Referred')]
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='visits')
    date=models.DateField(default=timezone.now)
    time=models.TimeField(default=timezone.now)
    complaint=models.TextField()
    diagnosis=models.CharField(max_length=255,blank=True)
    treatment=models.TextField(blank=True)
    notes=models.TextField(blank=True)
    vitals_bp=models.CharField(max_length=20,blank=True)
    vitals_temp=models.CharField(max_length=20,blank=True)
    vitals_pulse=models.CharField(max_length=20,blank=True)
    vitals_weight=models.CharField(max_length=20,blank=True)
    vitals_spo2=models.CharField(max_length=20,blank=True)
    attending=models.CharField(max_length=120,blank=True)
    status=models.CharField(max_length=20,choices=STATUS,default='awaiting_doctor')
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['-date','-time']
    def __str__(self): return f"{self.student} — {self.status} ({self.date})"

class Prescription(SoftDeleteModel):
    STATUS=[('pending','Pending'),('dispensed','Dispensed'),('cancelled','Cancelled')]
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    visit=models.ForeignKey(Visit,on_delete=models.CASCADE,related_name='prescriptions')
    student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='prescriptions')
    medication=models.ForeignKey(Medication,on_delete=models.PROTECT,related_name='prescriptions')
    dosage=models.CharField(max_length=80,blank=True)
    frequency=models.CharField(max_length=80,blank=True)
    duration=models.CharField(max_length=80,blank=True)
    quantity=models.PositiveIntegerField(default=1)
    status=models.CharField(max_length=20,choices=STATUS,default='pending')
    prescribed_by=models.CharField(max_length=120,blank=True)
    dispensed_at=models.DateTimeField(null=True,blank=True)
    dispensed_by=models.CharField(max_length=120,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['-created_at']
    def __str__(self): return f"{self.medication} for {self.student}"

class LabRequest(SoftDeleteModel):
    STATUS=[('ordered','Ordered'),('collected','Collected'),('resulted','Resulted'),('cancelled','Cancelled')]
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='lab_requests')
    visit=models.ForeignKey(Visit,on_delete=models.SET_NULL,null=True,blank=True,related_name='lab_requests')
    test_type=models.CharField(max_length=150)
    ordered_by=models.CharField(max_length=120,blank=True)
    ordered_at=models.DateField(default=timezone.now)
    status=models.CharField(max_length=20,choices=STATUS,default='ordered')
    result=models.TextField(blank=True)
    reviewed_by=models.CharField(max_length=120,blank=True)
    notes=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['-ordered_at']
    def __str__(self): return f"{self.test_type} — {self.student}"

class Immunization(SoftDeleteModel):
    id=models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='immunizations')
    vaccine=models.CharField(max_length=150)
    dose=models.CharField(max_length=50,blank=True)
    date=models.DateField()
    given_by=models.CharField(max_length=120,blank=True)
    batch_no=models.CharField(max_length=60,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='+')
    class Meta: ordering=['-date']
    def __str__(self): return f"{self.vaccine} ({self.dose}) — {self.student}"

class AuditEntry(models.Model):
    id=models.BigAutoField(primary_key=True)
    at=models.DateTimeField(auto_now_add=True,db_index=True)
    actor=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True,blank=True,related_name='audit_entries')
    actor_label=models.CharField(max_length=150,blank=True)
    action=models.CharField(max_length=50,db_index=True)
    model=models.CharField(max_length=50)
    target_id=models.CharField(max_length=64,blank=True)
    target_label=models.CharField(max_length=255,blank=True)
    details=models.TextField(blank=True)
    class Meta: ordering=['-at']
    def __str__(self): return f'{self.at:%Y-%m-%d %H:%M} {self.actor_label} {self.action} {self.model}'
