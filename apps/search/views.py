from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg
from apps.employees.models import Employee
from apps.performance.models import PerformanceReview
from apps.training.models import EmployeeSkill, EmployeeCertification
from .models import SavedSearch
from .serializers import SavedSearchSerializer, AdvancedSearchSerializer

class SavedSearchViewSet(viewsets.ModelViewSet):
    queryset = SavedSearch.objects.all()
    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]

class AdvancedSearchViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def search_employees(self, request):
        """Advanced employee search with multiple filters"""
        serializer = AdvancedSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        filters = serializer.validated_data
        query = Employee.objects.all()
        
        # Name filters
        if filters.get('first_name'):
            query = query.filter(user__first_name__icontains=filters['first_name'])
        if filters.get('last_name'):
            query = query.filter(user__last_name__icontains=filters['last_name'])
        if filters.get('email'):
            query = query.filter(user__email__icontains=filters['email'])
        if filters.get('phone'):
            query = query.filter(phone__icontains=filters['phone'])
        
        # Employment filters
        if filters.get('department'):
            query = query.filter(department__icontains=filters['department'])
        if filters.get('position'):
            query = query.filter(position__icontains=filters['position'])
        if filters.get('employment_type'):
            query = query.filter(employment_type=filters['employment_type'])
        if filters.get('status'):
            query = query.filter(status=filters['status'])
        
        # Salary range
        if filters.get('salary_min'):
            query = query.filter(base_salary__gte=filters['salary_min'])
        if filters.get('salary_max'):
            query = query.filter(base_salary__lte=filters['salary_max'])
        
        # Hire date range
        if filters.get('hired_date_from'):
            query = query.filter(hire_date__gte=filters['hired_date_from'])
        if filters.get('hired_date_to'):
            query = query.filter(hire_date__lte=filters['hired_date_to'])
        
        # Skills
        if filters.get('skills'):
            for skill in filters['skills']:
                query = query.filter(skills__skill__name__icontains=skill)
        
        # Performance rating
        if filters.get('min_performance_rating'):
            # Get employees with avg performance rating >= min
            query = query.annotate(
                avg_rating=Avg('performance_reviews__overall_rating')
            ).filter(avg_rating__gte=filters['min_performance_rating'])
        
        # Sorting
        sort_by = filters.get('sort_by', 'hire_date')
        sort_order = filters.get('sort_order', '-')
        
        if sort_by:
            order_field = f"{sort_order}{sort_by}" if sort_order == '-' else sort_by
            query = query.order_by(order_field)
        
        # Serialize results
        from apps.employees.serializers import EmployeeDetailedSerializer
        serializer = EmployeeDetailedSerializer(query, many=True)
        
        return Response({
            'count': query.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def salary_range_search(self, request):
        """Search employees by salary range"""
        salary_min = request.data.get('salary_min')
        salary_max = request.data.get('salary_max')
        
        query = Employee.objects.all()
        
        if salary_min:
            query = query.filter(base_salary__gte=salary_min)
        if salary_max:
            query = query.filter(base_salary__lte=salary_max)
        
        from apps.employees.serializers import EmployeeDetailedSerializer
        serializer = EmployeeDetailedSerializer(query, many=True)
        
        return Response({
            'count': query.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def save_search(self, request):
        """Save a search filter for future use"""
        name = request.data.get('name')
        description = request.data.get('description', '')
        filters = request.data.get('filters', {})
        
        saved_search = SavedSearch.objects.create(
            name=name,
            description=description,
            filters=filters
        )
        
        return Response(SavedSearchSerializer(saved_search).data)
    
    @action(detail=False, methods=['get'])
    def saved_searches(self, request):
        """Get all saved searches"""
        searches = SavedSearch.objects.all()
        serializer = SavedSearchSerializer(searches, many=True)
        return Response(serializer.data)
