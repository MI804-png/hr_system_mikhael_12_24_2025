from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PayrollPeriodViewSet, TaxConfigurationViewSet, DeductionViewSet,
    PayCheckViewSet, TimesheetEntryViewSet, BonusViewSet, RaiseViewSet, PayrollReportViewSet
)

router = DefaultRouter()
router.register(r'periods', PayrollPeriodViewSet, basename='payroll-period')
router.register(r'taxes', TaxConfigurationViewSet, basename='tax-configuration')
router.register(r'deductions', DeductionViewSet, basename='deduction')
router.register(r'paychecks', PayCheckViewSet, basename='paycheck')
router.register(r'timesheets', TimesheetEntryViewSet, basename='timesheet-entry')
router.register(r'bonuses', BonusViewSet, basename='bonus')
router.register(r'raises', RaiseViewSet, basename='raise')
router.register(r'reports', PayrollReportViewSet, basename='payroll-report')

urlpatterns = [
    path('', include(router.urls)),
]
