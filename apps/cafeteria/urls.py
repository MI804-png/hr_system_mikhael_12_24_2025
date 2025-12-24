from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CafeteriaMenuViewSet, CafeteriaOrderViewSet, CafeteriaBalanceViewSet
)

router = DefaultRouter()
router.register(r'menu', CafeteriaMenuViewSet, basename='menu')
router.register(r'orders', CafeteriaOrderViewSet, basename='order')
router.register(r'balance', CafeteriaBalanceViewSet, basename='balance')

urlpatterns = [
    path('', include(router.urls)),
]
