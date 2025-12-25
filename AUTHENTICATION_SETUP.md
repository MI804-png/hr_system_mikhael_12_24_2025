# Authentication System Setup Guide

## Overview
Complete authentication system with Login, Register, and protected routes for the HR System.

## Frontend Components Created

### 1. **AuthContext** (`src/context/AuthContext.tsx`)
Global context for managing user authentication state.

**Features:**
- User state management
- Token storage in localStorage
- Login/Register/Logout functions
- Auto-restore session on app load

**Usage:**
```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Welcome {user?.first_name}</div>;
}
```

### 2. **Login Page** (`app/login/page.tsx`)
- Email and password input fields
- Form validation
- Error handling
- Links to register page
- Demo credentials display
- Beautiful gradient UI

**Access:** `/login`

### 3. **Register Page** (`app/register/page.tsx`)
- First name, last name, email inputs
- Password with confirmation
- Form validation
- Password strength requirements
- Links back to login

**Access:** `/register`

### 4. **Protected Layout** (`src/components/ProtectedLayout.tsx`)
- Route protection middleware
- Auto-redirect unauthenticated users to login
- Loading state management
- Public pages bypass protection

### 5. **Dashboard Page** (`app/dashboard/page.tsx`)
- Main protected page after login
- Welcome message with user name
- KPI cards
- Quick actions
- Recent activities

**Access:** `/dashboard` (protected)

### 6. **Updated Sidebar**
- User info display (name and email)
- Logout button with proper cleanup
- Integration with AuthContext

### 7. **Updated Settings Page**
- Logout functionality
- Auth context integration

## Backend Setup Instructions

### Prerequisites
- Django 5.x
- Django REST Framework
- Python 3.8+

### Installation Steps

#### 1. Install Required Packages
```bash
pip install djangorestframework
pip install django-rest-framework-simplejwt
# OR for token-based auth:
pip install drf-authtoken
```

#### 2. Update Django Settings
```python
# settings.py

INSTALLED_APPS = [
    # ... other apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',  # Enable CORS
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

#### 3. Create Auth API App
```bash
python manage.py startapp auth_api
```

#### 4. Add Auth Views
Create `auth_api/views.py`:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'detail': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user = authenticate(username=user.username, password=password)
    
    if user is None:
        return Response(
            {'detail': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': 'admin' if user.is_staff else 'user'
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'detail': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(password) < 6:
        return Response(
            {'detail': 'Password must be at least 6 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'detail': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    username = email.split('@')[0]
    counter = 1
    original_username = username
    while User.objects.filter(username=username).exists():
        username = f"{original_username}{counter}"
        counter += 1
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': 'admin' if user.is_staff else 'user'
        }
    }, status=status.HTTP_201_CREATED)
```

#### 5. Add Auth URLs
Create `auth_api/urls.py`:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
]
```

#### 6. Include Auth URLs in Main URLs
```python
# urls.py (main project)
from django.urls import path, include

urlpatterns = [
    # ... other paths
    path('api/auth/', include('auth_api.urls')),
]
```

#### 7. Run Migrations
```bash
python manage.py migrate
```

#### 8. Create Test Users
```bash
python manage.py shell

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Create admin user
user = User.objects.create_user(
    username='admin',
    email='admin@company.com',
    password='admin123',
    first_name='Admin',
    last_name='User',
    is_staff=True
)
Token.objects.create(user=user)

# Create regular user
user = User.objects.create_user(
    username='john',
    email='john@company.com',
    password='john123',
    first_name='John',
    last_name='Doe'
)
Token.objects.create(user=user)

exit()
```

## Testing the System

### 1. Start Frontend
```bash
cd hr-frontend
npm run dev
```

### 2. Start Django Backend
```bash
python manage.py runserver 0.0.0.0:8000
```

### 3. Test Login
1. Go to `http://localhost:3000/login`
2. Use demo credentials:
   - Email: `admin@company.com`
   - Password: `admin123`
3. You should be redirected to `/dashboard`

### 4. Test Register
1. Go to `http://localhost:3000/register`
2. Create a new account with valid details
3. You should be logged in automatically

### 5. Test Logout
- Click logout button in Sidebar
- You should be redirected to login page

### 6. Test Protected Routes
- Try accessing any page without login
- You should be redirected to login page

## API Endpoints

### Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "token_string_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }
}
```

### Register
```
POST /api/auth/register/
Content-Type: application/json

{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "password": "password123"
}

Response:
{
  "token": "token_string_here",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "user"
  }
}
```

## Frontend Flow

1. **Root Page** (`/`)
   - Redirects to `/dashboard` if authenticated
   - Redirects to `/login` if not authenticated

2. **Login Page** (`/login`)
   - Email and password form
   - Link to register page
   - Demo credentials

3. **Register Page** (`/register`)
   - Account creation form
   - Link back to login

4. **Protected Pages** (all except login/register)
   - Require authentication
   - Redirect to login if not authenticated

5. **Dashboard** (`/dashboard`)
   - Main landing page for authenticated users
   - Shows user welcome message

## Security Features

✅ Token-based authentication
✅ Password hashing (Django built-in)
✅ Protected routes
✅ Session management
✅ Auto-login after registration
✅ Logout with session cleanup
✅ CORS protection
✅ Email validation
✅ Password validation (minimum 6 characters)
✅ User-friendly error messages

## Troubleshooting

### CORS Errors
- Make sure `django-cors-headers` is installed
- Add `http://localhost:3000` to `CORS_ALLOWED_ORIGINS`
- Make sure `CorsMiddleware` is in MIDDLEWARE

### Login Failing
- Verify user exists in database
- Check password is correct
- Ensure Django backend is running on port 8000

### Token Not Saving
- Check browser localStorage is enabled
- Check browser console for errors
- Verify API response includes token

### Protected Routes Redirecting
- Ensure `AuthProvider` wraps root layout
- Check `ProtectedLayout` is properly configured
- Verify localStorage keys match in AuthContext

## Next Steps

1. Add email verification for registration
2. Implement password reset functionality
3. Add social login (Google, GitHub)
4. Implement JWT tokens instead of simple tokens
5. Add role-based access control
6. Add 2FA (Two-Factor Authentication)
7. Add session timeout
8. Add remember me functionality
