from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import AIAssistantConversation, ConversationMessage
from .serializers import AIAssistantConversationSerializer, ConversationMessageSerializer

class AIAssistantViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new AI conversation"""
        conversation = AIAssistantConversation.objects.create(
            user=request.user,
            title=request.data.get('title', 'New Conversation')
        )
        return Response(AIAssistantConversationSerializer(conversation).data)
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all conversations for current user"""
        conversations = AIAssistantConversation.objects.filter(user=request.user)
        serializer = AIAssistantConversationSerializer(conversations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def ask_question(self, request):
        """Ask a question to the AI assistant"""
        conversation_id = request.data.get('conversation_id')
        question = request.data.get('question')
        
        if not conversation_id or not question:
            return Response(
                {'detail': 'conversation_id and question required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = AIAssistantConversation.objects.get(id=conversation_id, user=request.user)
        except AIAssistantConversation.DoesNotExist:
            return Response(
                {'detail': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Save user message
        user_message = ConversationMessage.objects.create(
            conversation=conversation,
            role='user',
            content=question
        )
        
        # Generate AI response (mock implementation)
        ai_response = self._generate_ai_response(question, request.user)
        
        # Save AI response
        assistant_message = ConversationMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=ai_response,
            query_type=self._classify_query(question)
        )
        
        # Update conversation title if it's the first message
        if conversation.messages.count() == 2:
            conversation.title = question[:100]
            conversation.save()
        
        return Response({
            'user_message': ConversationMessageSerializer(user_message).data,
            'assistant_message': ConversationMessageSerializer(assistant_message).data
        })
    
    def _classify_query(self, question):
        """Classify the type of query"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['policy', 'policies', 'rules', 'conduct']):
            return 'policy'
        elif any(word in question_lower for word in ['procedure', 'how to', 'process', 'steps']):
            return 'procedure'
        elif any(word in question_lower for word in ['benefit', 'insurance', 'retirement', 'wellness']):
            return 'benefits'
        elif any(word in question_lower for word in ['leave', 'pto', 'vacation', 'sick', 'absent']):
            return 'leave'
        elif any(word in question_lower for word in ['salary', 'pay', 'compensation', 'bonus', 'raise']):
            return 'salary'
        return 'general'
    
    def _generate_ai_response(self, question, user):
        """Generate AI response based on question"""
        # This is a mock implementation - in production, you'd integrate with an LLM
        
        question_lower = question.lower()
        
        responses = {
            'policy': "Based on our company policies, you can find more information in the policies section. For specific details, please contact HR.",
            'procedure': "Here's how to proceed: Please follow the standard process outlined in our employee handbook. Contact your manager or HR if you need clarification.",
            'benefits': "We offer comprehensive benefits including health insurance, retirement plans, and wellness programs. Visit the benefits page for more details.",
            'leave': "For leave requests, please submit through the attendance system. You have a specific number of PTO days allocated annually.",
            'salary': "Salary information is handled confidentially. Please discuss compensation matters with your HR manager.",
            'general': "Thank you for your question. Please provide more details so I can better assist you."
        }
        
        query_type = self._classify_query(question)
        return responses.get(query_type, responses['general'])
    
    @action(detail=False, methods=['post'])
    def get_hr_information(self, request):
        """Get HR information based on query"""
        query = request.data.get('query')
        
        if not query:
            return Response(
                {'detail': 'query parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mock HR database query
        from apps.employees.models import Employee
        from apps.compliance.models import CompanyPolicy
        
        response_data = {
            'query': query,
            'information': [],
            'suggestions': []
        }
        
        # Search for relevant policies
        policies = CompanyPolicy.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )[:3]
        
        for policy in policies:
            response_data['information'].append({
                'type': 'policy',
                'title': policy.title,
                'description': policy.description
            })
        
        # Provide suggestions
        response_data['suggestions'] = [
            "Would you like to know more about our attendance policy?",
            "Need information about benefits enrollment?",
            "Would you like to file a grievance?"
        ]
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def search_policies(self, request):
        """Search company policies"""
        search_term = request.data.get('search_term')
        
        if not search_term:
            return Response(
                {'detail': 'search_term required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.compliance.models import CompanyPolicy
        from django.db.models import Q
        
        policies = CompanyPolicy.objects.filter(
            Q(title__icontains=search_term) | 
            Q(description__icontains=search_term) |
            Q(full_text__icontains=search_term),
            is_active=True
        )
        
        results = [{
            'id': policy.id,
            'title': policy.title,
            'type': policy.policy_type,
            'description': policy.description[:200]
        } for policy in policies]
        
        return Response({
            'search_term': search_term,
            'count': len(results),
            'results': results
        })
    
    @action(detail=False, methods=['post'])
    def get_benefits_info(self, request):
        """Get benefits information"""
        from apps.benefits.models import BenefitPackage, BenefitType
        
        packages = BenefitPackage.objects.filter(is_active=True)
        
        results = [{
            'name': package.name,
            'description': package.description,
            'monthly_cost': str(package.monthly_cost),
            'benefits': [b.name for b in package.benefits.all()]
        } for package in packages]
        
        return Response({
            'available_benefits': results,
            'message': 'Here are our available benefit packages. Contact HR for enrollment.'
        })
