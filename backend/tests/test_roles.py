import pytest
from clinic.models import Visit,Prescription,Medication

@pytest.mark.django_db
def test_doctor_cannot_create_visit(doctor_client,student):
    payload={'studentId':str(student.id),'date':'2025-01-01','time':'09:00',
        'complaint':'Headache','attending':'Dr. X','vitals':{'bp':'120/80'}}
    r=doctor_client.post('/api/visits/',payload,format='json')
    assert r.status_code==403
@pytest.mark.django_db
def test_pharmacist_cannot_create_visit(pharmacist_client,student):
    payload={'studentId':str(student.id),'date':'2025-01-01','time':'09:00',
        'complaint':'Headache','attending':'P','vitals':{}}
    assert pharmacist_client.post('/api/visits/',payload,format='json').status_code==403
@pytest.mark.django_db
def test_nurse_creates_visit(nurse_client,student):
    payload={'studentId':str(student.id),'date':'2025-01-01','time':'09:00',
        'complaint':'Fever','attending':'Nurse X',
        'vitals':{'bp':'120/80','temp':'38.5','pulse':'88','weight':'65','spo2':'98'}}
    r=nurse_client.post('/api/visits/',payload,format='json')
    assert r.status_code==201 and r.json()['status']=='awaiting_doctor'
@pytest.mark.django_db
def test_nurse_diagnosis_ignored(nurse_client,student):
    payload={'studentId':str(student.id),'date':'2025-01-01','time':'09:00',
        'complaint':'Fever','attending':'Nurse X','diagnosis':'Malaria','vitals':{}}
    r=nurse_client.post('/api/visits/',payload,format='json')
    assert r.status_code==201 and r.json()['diagnosis']==''
@pytest.mark.django_db
def test_doctor_diagnoses(doctor_client,visit):
    r=doctor_client.patch(f'/api/visits/{visit.id}/',
        {'diagnosis':'Malaria','treatment':'ACT','status':'completed'},format='json')
    assert r.status_code==200
    visit.refresh_from_db(); assert visit.diagnosis=='Malaria'
@pytest.mark.django_db
def test_doctor_cannot_edit_completed(doctor_client,completed_visit):
    r=doctor_client.patch(f'/api/visits/{completed_visit.id}/',{'diagnosis':'Changed'},format='json')
    assert r.status_code in (400,403)
@pytest.mark.django_db
def test_doctor_requires_diagnosis(doctor_client,visit):
    r=doctor_client.patch(f'/api/visits/{visit.id}/',{'treatment':'Rest','status':'completed'},format='json')
    assert r.status_code==400
@pytest.mark.django_db
def test_nurse_cannot_edit_completed(nurse_client,completed_visit):
    r=nurse_client.patch(f'/api/visits/{completed_visit.id}/',{'complaint':'X'},format='json')
    assert r.status_code in (400,403)
@pytest.mark.django_db
def test_nurse_can_edit_awaiting(nurse_client,visit):
    r=nurse_client.patch(f'/api/visits/{visit.id}/',
        {'complaint':'Updated','vitals':{'bp':'118/78'}},format='json')
    assert r.status_code==200
@pytest.mark.django_db
def test_nurse_cannot_prescribe(nurse_client,visit,medication):
    payload={'visitId':str(visit.id),'studentId':str(visit.student_id),
        'medicationId':str(medication.id),'dosage':'1 tab','frequency':'TDS',
        'duration':'3 days','quantity':9}
    assert nurse_client.post('/api/prescriptions/',payload,format='json').status_code==403
@pytest.mark.django_db
def test_doctor_prescribes_on_awaiting(doctor_client,visit,medication):
    payload={'visitId':str(visit.id),'studentId':str(visit.student_id),
        'medicationId':str(medication.id),'dosage':'1 tab','frequency':'TDS',
        'duration':'3 days','quantity':9}
    assert doctor_client.post('/api/prescriptions/',payload,format='json').status_code==201
@pytest.mark.django_db
def test_doctor_cannot_prescribe_on_completed(doctor_client,completed_visit,medication):
    payload={'visitId':str(completed_visit.id),'studentId':str(completed_visit.student_id),
        'medicationId':str(medication.id),'dosage':'1','frequency':'TDS',
        'duration':'3d','quantity':9}
    assert doctor_client.post('/api/prescriptions/',payload,format='json').status_code==400
@pytest.mark.django_db
def test_allergy_blocks_penicillin(doctor_client,visit,penicillin):
    payload={'visitId':str(visit.id),'studentId':str(visit.student_id),
        'medicationId':str(penicillin.id),'dosage':'1 cap','frequency':'TDS',
        'duration':'5d','quantity':15}
    r=doctor_client.post('/api/prescriptions/',payload,format='json')
    assert r.status_code==400 and 'allergy' in str(r.json()).lower()
@pytest.mark.django_db
def test_doctor_cannot_dispense(doctor_client,prescription):
    r=doctor_client.post(f'/api/prescriptions/{prescription.id}/dispense/',
        {'quantity':5},format='json')
    assert r.status_code==403
@pytest.mark.django_db
def test_pharmacist_dispenses(pharmacist_client,prescription):
    initial=prescription.medication.quantity
    r=pharmacist_client.post(f'/api/prescriptions/{prescription.id}/dispense/',
        {'quantity':9},format='json')
    assert r.status_code==200
    prescription.refresh_from_db(); prescription.medication.refresh_from_db()
    assert prescription.status=='dispensed'
    assert prescription.medication.quantity==initial-9
@pytest.mark.django_db
def test_doctor_cannot_create_medication(doctor_client):
    payload={'name':'Aspirin','strength':'300 mg','form':'Tablet','category':'NSAID',
        'unit':'tablets','quantity':100,'reorderLevel':20}
    assert doctor_client.post('/api/medications/',payload,format='json').status_code==403
@pytest.mark.django_db
def test_pharmacist_creates_medication(pharmacist_client):
    payload={'name':'Aspirin','strength':'300 mg','form':'Tablet','category':'NSAID',
        'unit':'tablets','quantity':100,'reorderLevel':20}
    assert pharmacist_client.post('/api/medications/',payload,format='json').status_code==201
@pytest.mark.django_db
def test_nurse_reads_students(nurse_client,student):
    assert nurse_client.get('/api/students/').status_code==200
@pytest.mark.django_db
def test_nurse_cannot_create_student(nurse_client):
    payload={'studentId':'STU/X','firstName':'A','lastName':'B','gender':'Female',
        'faculty':'Science','level':'100','allergies':[],'conditions':[],'emergency':{}}
    assert nurse_client.post('/api/students/',payload,format='json').status_code==403
@pytest.mark.django_db
def test_student_lookup_by_name(admin_client,student):
    r=admin_client.get('/api/students/lookup/?q=Ada')
    assert r.status_code==200 and len(r.json())==1 and r.json()[0]['studentId']=='STU/2025/0001'
@pytest.mark.django_db
def test_student_profile_endpoint(admin_client,student,visit):
    r=admin_client.get(f'/api/students/{student.id}/profile/')
    assert r.status_code==200
    b=r.json()
    assert set(b.keys())=={'student','visits','prescriptions','immunizations','lab_requests'}
    assert len(b['visits'])==1
@pytest.mark.django_db
def test_dashboard_summary(doctor_client,student,visit):
    r=doctor_client.get('/api/dashboard/')
    assert r.status_code==200
    b=r.json()
    assert 'student_count' in b and 'recent_visits' in b
    assert b['recent_visits'][0]['student']['firstName']=='Ada'
@pytest.mark.django_db
def test_visit_embeds_student(doctor_client,visit):
    r=doctor_client.get(f'/api/visits/{visit.id}/')
    assert r.status_code==200
    assert r.json()['student']['firstName']=='Ada'
