from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (StudentViewSet,MedicationViewSet,VisitViewSet,PrescriptionViewSet,
    LabRequestViewSet,ImmunizationViewSet,AuditEntryViewSet,UserViewSet,TrashViewSet,
    ReportsViewSet,dashboard_summary)
from .auth_views import login_view,logout_view,me_view,refresh_view
router=DefaultRouter()
router.register('students',StudentViewSet,basename='student')
router.register('medications',MedicationViewSet,basename='medication')
router.register('visits',VisitViewSet,basename='visit')
router.register('prescriptions',PrescriptionViewSet,basename='prescription')
router.register('lab-requests',LabRequestViewSet,basename='lab-request')
router.register('immunizations',ImmunizationViewSet,basename='immunization')
router.register('audit',AuditEntryViewSet,basename='audit')
router.register('users',UserViewSet,basename='user')
router.register('trash',TrashViewSet,basename='trash')
router.register('reports',ReportsViewSet,basename='reports')
urlpatterns=[path('auth/login/',login_view,name='login'),path('auth/refresh/',refresh_view,name='refresh'),
 path('auth/me/',me_view,name='me'),path('auth/logout/',logout_view,name='logout'),
 path('dashboard/',dashboard_summary,name='dashboard')]+router.urls
