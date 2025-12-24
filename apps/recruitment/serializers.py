from rest_framework import serializers
from .models import JobPosting, Candidate, Interview, OfferLetter, Onboarding, OnboardingChecklist

class JobPostingSerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'department', 'description', 'requirements',
            'salary_range_min', 'salary_range_max', 'position_type', 'status',
            'posted_date', 'closing_date', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'posted_date']

class CandidateSerializer(serializers.ModelSerializer):
    job_posting_title = serializers.CharField(source='job_posting.title', read_only=True)
    assigned_to_name = serializers.StringRelatedField(source='assigned_to', read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'job_posting', 'job_posting_title', 'first_name', 'last_name',
            'email', 'phone', 'resume', 'cover_letter', 'source', 'status',
            'rating', 'applied_date', 'assigned_to', 'assigned_to_name', 'notes'
        ]
        read_only_fields = ['id', 'applied_date']

class InterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    interviewer_name = serializers.StringRelatedField(source='interviewer', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'candidate', 'candidate_name', 'interview_type', 'status',
            'scheduled_date', 'duration_minutes', 'interviewer', 'interviewer_name',
            'location', 'feedback', 'rating'
        ]
        read_only_fields = ['id']

class OfferLetterSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    
    class Meta:
        model = OfferLetter
        fields = [
            'id', 'candidate', 'candidate_name', 'position_title', 'salary',
            'start_date', 'benefits_summary', 'terms_conditions', 'status',
            'sent_date', 'expiry_date', 'accepted_date', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at']

class OnboardingChecklistSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source='assigned_to', read_only=True)
    
    class Meta:
        model = OnboardingChecklist
        fields = [
            'id', 'title', 'description', 'category', 'is_completed',
            'assigned_to', 'assigned_to_name', 'due_date', 'completed_date'
        ]
        read_only_fields = ['id']

class OnboardingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    mentor_name = serializers.StringRelatedField(source='mentor_assigned', read_only=True)
    checklists = OnboardingChecklistSerializer(many=True, read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Onboarding
        fields = [
            'id', 'employee', 'employee_name', 'status',
            'equipment_assigned', 'it_account_created', 'email_setup',
            'access_credentials_issued', 'orientation_completed',
            'policy_acknowledgment', 'nda_signed', 'contract_signed',
            'tax_forms_completed', 'emergency_contact_provided',
            'mentor_assigned', 'mentor_name', 'start_date',
            'expected_completion_date', 'actual_completion_date',
            'completion_percentage', 'notes', 'checklists'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
