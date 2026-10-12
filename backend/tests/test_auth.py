import pytest
@pytest.mark.django_db
def test_login_ok(client,admin_user):
    r=client.post('/api/auth/login/',{'username':'t_admin','password':'test12345'},content_type='application/json')
    assert r.status_code==200
    b=r.json(); assert 'access' in b and b['user']['role']=='admin'
@pytest.mark.django_db
def test_login_bad(client,admin_user):
    r=client.post('/api/auth/login/',{'username':'t_admin','password':'x'},content_type='application/json')
    assert r.status_code==401
@pytest.mark.django_db
def test_me_requires_auth(client):
    assert client.get('/api/auth/me/').status_code in (401,403)
@pytest.mark.django_db
def test_me(admin_client):
    r=admin_client.get('/api/auth/me/'); assert r.status_code==200 and r.json()['role']=='admin'
