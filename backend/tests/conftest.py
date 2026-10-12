import pytest
from django.contrib.auth.models import User,Group
from rest_framework.test import APIClient
from clinic.models import Student,Medication,Visit,Prescription
@pytest.fixture(autouse=True)
def _groups(db):
    for n in ['admin','doctor','nurse','pharmacist','receptionist']: Group.objects.get_or_create(name=n)
def _u(u,r):
    x=User.objects.create_user(username=u,password='test12345')
    x.groups.set([Group.objects.get(name=r)]); return x
@pytest.fixture
def admin_user(db): return _u('t_admin','admin')
@pytest.fixture
def doctor_user(db): return _u('t_doctor','doctor')
@pytest.fixture
def nurse_user(db): return _u('t_nurse','nurse')
@pytest.fixture
def pharmacist_user(db): return _u('t_pharm','pharmacist')
def _c(u):
    c=APIClient(); c.force_authenticate(user=u); return c
@pytest.fixture
def admin_client(admin_user): return _c(admin_user)
@pytest.fixture
def doctor_client(doctor_user): return _c(doctor_user)
@pytest.fixture
def nurse_client(nurse_user): return _c(nurse_user)
@pytest.fixture
def pharmacist_client(pharmacist_user): return _c(pharmacist_user)
@pytest.fixture
def student(db):
    return Student.objects.create(student_id='STU/2025/0001',first_name='Ada',last_name='Test',
        gender='Female',faculty='Science',department='Biology',level='200',
        allergies=['Penicillin'],conditions=[])
@pytest.fixture
def medication(db):
    return Medication.objects.create(name='Paracetamol',strength='500 mg',form='Tablet',
        category='Analgesic',unit='tablets',quantity=100,reorder_level=20,unit_cost='12.50')
@pytest.fixture
def penicillin(db):
    return Medication.objects.create(name='Amoxicillin',strength='500 mg',form='Capsule',
        category='Antibiotic',unit='capsules',quantity=100,reorder_level=20,unit_cost='65')
@pytest.fixture
def visit(db,student):
    return Visit.objects.create(student=student,complaint='Sore throat',
        status='awaiting_doctor',attending='Nurse Test')
@pytest.fixture
def completed_visit(db,student):
    return Visit.objects.create(student=student,complaint='Sore throat',diagnosis='Tonsillitis',
        status='completed',attending='Dr. Test')
@pytest.fixture
def prescription(db,visit,student,medication):
    return Prescription.objects.create(visit=visit,student=student,medication=medication,
        dosage='1 tab',frequency='TDS',duration='3 days',quantity=9,prescribed_by='Dr. Test')
