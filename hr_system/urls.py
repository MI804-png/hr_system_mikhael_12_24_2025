from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def root_view(request):
    """Root API endpoint with available services"""
    return JsonResponse({
        'message': 'HR System API Server',
        'version': '1.0.0',
        'status': 'running',
        'documentation': 'Available endpoints are prefixed with /api/',
        'endpoints': {
            'authentication': '/api/auth/login/',
            'core': '/api/core/',
            'hr': '/api/employees/, /api/attendance/, /api/salary/, /api/reports/',
            'advanced': '/api/recruitment/, /api/benefits/, /api/performance/, /api/training/',
            'financial': '/api/payroll/, /api/budgeting/, /api/compensation/', 
            'strategic': '/api/equity/, /api/csr/, /api/retention/, /api/data/',
            'compliance': '/api/hr-compliance/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    
    # Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Core
    path('api/core/', include('apps.core.urls')),
    
    # Core Apps
    path('api/employees/', include('apps.employees.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/salary/', include('apps.salary.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/cafeteria/', include('apps.cafeteria.urls')),
    path('api/reports/', include('apps.reports.urls')),
    
    # Advanced HR Features
    path('api/recruitment/', include('apps.recruitment.urls')),
    path('api/benefits/', include('apps.benefits.urls')),
    # path('api/compliance/', include('apps.compliance.urls')),  # Replaced by api/hr-compliance
    # path('api/relations/', include('apps.relations.urls')),  # Merged into retention management
    path('api/performance/', include('apps.performance.urls')),
    path('api/training/', include('apps.training.urls')),
    path('api/search/', include('apps.search.urls')),
    path('api/ai-assistant/', include('apps.ai_assistant.urls')),
    
    # Financial & Payroll
    path('api/payroll/', include('apps.payroll.urls')),
    path('api/budgeting/', include('apps.budgeting.urls')),
    path('api/compensation/', include('apps.compensation.urls')),
    path('api/financial-compliance/', include('apps.financial_compliance.urls')),
    path('api/financial-planning/', include('apps.financial_planning.urls')),
    
    # Strategic HR & Operations
    path('api/equity/', include('apps.equity_management.urls')),
    path('api/csr/', include('apps.csr_sustainability.urls')),
    path('api/retention/', include('apps.retention_management.urls')),
    path('api/data/', include('apps.data_export_import.urls')),
    
    # Compliance & Regulations
    path('api/hr-compliance/', include('apps.hr_compliance.urls')),
]