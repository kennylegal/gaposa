from django.contrib.auth import get_user_model
from django.db.models.signals import post_save,post_delete
from .models import (AuditEntry,Student,Medication,Visit,Prescription,
                     LabRequest,Immunization)
from .middleware import get_current_user
TRACKED=[Student,Medication,Visit,Prescription,LabRequest,Immunization]
def _label(i):
    for a in ('student_id','name','test_type','vaccine'):
        v=getattr(i,a,None)
        if v: return str(v)[:255]
    return str(i)[:255]
def _h(action):
    def handler(sender,instance,**kw):
        actor=get_current_user()
        actual=action
        if action=='create_or_update':
            if kw.get('created'): actual='create'
            elif getattr(instance,'is_deleted',False): actual='soft_delete'
            else: actual='update'
        AuditEntry.objects.create(actor=actor if isinstance(actor,get_user_model()) else None,
            actor_label=(actor.get_username() if actor else 'system'),
            action=actual,model=sender.__name__,target_id=str(getattr(instance,'pk','')),
            target_label=_label(instance),details='')
    return handler
for m in TRACKED:
    post_save.connect(_h('create_or_update'),sender=m,dispatch_uid=f'save_{m.__name__}')
    post_delete.connect(_h('delete'),sender=m,dispatch_uid=f'del_{m.__name__}')
