from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, EmployeeBenefitsViewSet, LeaveViewSet

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')
router.register(r'benefits', EmployeeBenefitsViewSet, basename='benefits')
router.register(r'leaves', LeaveViewSet, basename='leave')

urlpatterns = [
    path('', include(router.urls)),
]
