from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BudgetCategoryViewSet, DepartmentBudgetViewSet, BudgetAllocationViewSet,
    ExpenditureViewSet, BudgetForecastViewSet, BudgetReviewViewSet
)

router = DefaultRouter()
router.register(r'categories', BudgetCategoryViewSet, basename='budget-category')
router.register(r'department-budgets', DepartmentBudgetViewSet, basename='department-budget')
router.register(r'allocations', BudgetAllocationViewSet, basename='budget-allocation')
router.register(r'expenditures', ExpenditureViewSet, basename='expenditure')
router.register(r'forecasts', BudgetForecastViewSet, basename='budget-forecast')
router.register(r'reviews', BudgetReviewViewSet, basename='budget-review')

urlpatterns = [
    path('', include(router.urls)),
]
