from django.contrib.auth.models import User,Group
from django.core.management.base import BaseCommand
DEMO=[('admin','admin123','System Administrator','admin'),('doctor','doctor123','Dr. A. Bello','doctor'),
    ('nurse','nurse123','Nurse F. Adeyemi','nurse'),('pharmacist','pharma123','Pharm. J. Okafor','pharmacist'),
    ('receptionist','reception123','Ms. R. Yusuf','receptionist')]
class Command(BaseCommand):
    def handle(self,*a,**kw):
        for r in ['admin','doctor','nurse','pharmacist','receptionist']: Group.objects.get_or_create(name=r)
        for username,password,full_name,role in DEMO:
            u,_=User.objects.get_or_create(username=username)
            u.set_password(password); f,_,l=full_name.partition(' ')
            u.first_name=f; u.last_name=l; u.is_staff=u.is_superuser=(role=='admin'); u.save()
            u.groups.set([Group.objects.get(name=role)])
        self.stdout.write(self.style.SUCCESS('Demo users ready:'))
        for username,password,_,role in DEMO:
            self.stdout.write(f'  {username:14s} / {password:14s}  ({role})')
