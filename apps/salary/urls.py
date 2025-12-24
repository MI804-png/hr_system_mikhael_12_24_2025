from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryViewSet, PayrollBatchViewSet

router = DefaultRouter()
router.register(r'salaries', SalaryViewSet, basename='salary')
router.register(r'batches', PayrollBatchViewSet, basename='payroll_batch')

urlpatterns = [
    path('', include(router.urls)),
]
