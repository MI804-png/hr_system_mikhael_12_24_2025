from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'export-templates', views.ExportTemplateViewSet, basename='export-template')
router.register(r'data-exports', views.DataExportViewSet, basename='data-export')
router.register(r'import-templates', views.ImportTemplateViewSet, basename='import-template')
router.register(r'data-imports', views.DataImportViewSet, basename='data-import')
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'generated-reports', views.GeneratedReportViewSet, basename='generated-report')
router.register(r'print-templates', views.PrintTemplateViewSet, basename='print-template')
router.register(r'printed-documents', views.PrintedDocumentViewSet, basename='printed-document')

urlpatterns = [
    path('', include(router.urls)),
]
