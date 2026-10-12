from django.contrib import admin
from .models import Student,Medication,Visit,Prescription,LabRequest,Immunization,AuditEntry
@admin.register(Student)
class SA(admin.ModelAdmin):
    list_display=('student_id','first_name','last_name','faculty','level','is_deleted')
    list_filter=('faculty','level','gender','is_deleted')
    search_fields=('student_id','first_name','last_name','email')
@admin.register(Medication)
class MA(admin.ModelAdmin):
    list_display=('name','strength','category','quantity','reorder_level','expiry_date','is_deleted')
    list_filter=('category','is_deleted'); search_fields=('name','batch_no','supplier')
@admin.register(Visit)
class VA(admin.ModelAdmin):
    list_display=('student','date','status','attending','is_deleted')
    list_filter=('status','is_deleted')
@admin.register(Prescription)
class PA(admin.ModelAdmin):
    list_display=('student','medication','quantity','status','dispensed_at','is_deleted')
    list_filter=('status','is_deleted')
@admin.register(LabRequest)
class LA(admin.ModelAdmin):
    list_display=('student','test_type','ordered_at','status','is_deleted')
    list_filter=('status','is_deleted')
@admin.register(Immunization)
class IA(admin.ModelAdmin):
    list_display=('student','vaccine','dose','date','given_by','is_deleted')
    list_filter=('vaccine','is_deleted')
@admin.register(AuditEntry)
class AA(admin.ModelAdmin):
    list_display=('at','actor_label','action','model','target_label')
    list_filter=('action','model'); search_fields=('actor_label','target_label')
    readonly_fields=[f.name for f in AuditEntry._meta.fields]
