from rest_framework import serializers
from apps.training.models import (
    TrainingProgram, TrainingEnrollment, Certification, EmployeeCertification,
    Skill, EmployeeSkill, LearningPath, EmployeeLearningPath
)

class TrainingProgramSerializer(serializers.ModelSerializer):
    trainer_name = serializers.StringRelatedField(source='trainer', read_only=True)
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    
    class Meta:
        model = TrainingProgram
        fields = [
            'id', 'name', 'description', 'category', 'content', 'trainer',
            'trainer_name', 'start_date', 'end_date', 'duration_hours', 'location',
            'max_participants', 'cost_per_participant', 'status',
            'certification_provided', 'is_mandatory', 'created_by', 'created_by_name'
        ]

class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    program_name = serializers.CharField(source='training_program.name', read_only=True)
    
    class Meta:
        model = TrainingEnrollment
        fields = [
            'id', 'employee', 'employee_name', 'training_program', 'program_name',
            'enrollment_date', 'status', 'completion_date', 'assessment_score',
            'assessment_result', 'feedback'
        ]

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = [
            'id', 'name', 'description', 'issuing_organization', 'validity_years',
            'cost', 'is_mandatory', 'is_active'
        ]

class EmployeeCertificationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    certification_name = serializers.CharField(source='certification.name', read_only=True)
    
    class Meta:
        model = EmployeeCertification
        fields = [
            'id', 'employee', 'employee_name', 'certification', 'certification_name',
            'obtained_date', 'expiry_date', 'certificate_number', 'document',
            'renewal_required_date'
        ]

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'category', 'is_active']

class EmployeeSkillSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    verified_by_name = serializers.StringRelatedField(source='verified_by', read_only=True)
    
    class Meta:
        model = EmployeeSkill
        fields = [
            'id', 'employee', 'employee_name', 'skill', 'skill_name',
            'proficiency_level', 'years_of_experience', 'last_used_date',
            'verified', 'verified_by', 'verified_by_name', 'verified_date'
        ]

class LearningPathSerializer(serializers.ModelSerializer):
    training_programs_detail = TrainingProgramSerializer(source='training_programs', many=True, read_only=True)
    required_skills_detail = SkillSerializer(source='required_skills', many=True, read_only=True)
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'name', 'description', 'target_role', 'duration_months',
            'training_programs', 'training_programs_detail', 'required_skills',
            'required_skills_detail', 'is_active'
        ]

class EmployeeLearningPathSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    learning_path_name = serializers.CharField(source='learning_path.name', read_only=True)
    
    class Meta:
        model = EmployeeLearningPath
        fields = [
            'id', 'employee', 'employee_name', 'learning_path', 'learning_path_name',
            'enrollment_date', 'start_date', 'expected_completion_date', 'status',
            'actual_completion_date', 'progress_percentage'
        ]
