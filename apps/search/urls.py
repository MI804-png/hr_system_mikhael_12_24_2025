from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavedSearchViewSet, AdvancedSearchViewSet

router = DefaultRouter()
router.register(r'saved-searches', SavedSearchViewSet, basename='saved_search')
router.register(r'advanced', AdvancedSearchViewSet, basename='advanced_search')

urlpatterns = [
    path('', include(router.urls)),
]
