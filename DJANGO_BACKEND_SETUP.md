# Django Backend Setup - Copy & Paste Guide

This guide provides exact code to copy and paste into your Django project.

## Step 1: Install Packages

```bash
pip install djangorestframework
pip install django-cors-headers
```

## Step 2: Update settings.py

Add these to your Django settings.py file:

```python
# settings.py

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    
    # Your apps
    # ... other apps ...
    'auth_api',  # Add this new app
]

# Add corsheaders middleware (should be near the top)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add this
    'django.middleware.security.SecurityMiddleware',
    # ... rest of middleware ...
]

# Add CORS configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
]

# Add REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

## Step 3: Create Auth App

```bash
cd your_django_project
python manage.py startapp auth_api
```

## Step 4: Create auth_api/views.py

Create a new file `auth_api/views.py` with this exact content:

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
    """
    Login endpoint
    POST /api/auth/login/
    
    Body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
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
    """
    Register endpoint
    POST /api/auth/register/
    
    Body:
    {
        "email": "newuser@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "password": "password123"
    }
    """
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

## Step 5: Create auth_api/urls.py

Create a new file `auth_api/urls.py` with this exact content:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
]
```

## Step 6: Update main urls.py

Update your main project `urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_api.urls')),
    # ... your other URLs ...
]
```

## Step 7: Run Migrations

```bash
python manage.py migrate
```

## Step 8: Create Test Users (Django Shell)

```bash
python manage.py shell
```

Then in the Python shell, paste this:

```python
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Create admin user
admin_user = User.objects.create_user(
    username='admin',
    email='admin@company.com',
    password='admin123',
    first_name='Admin',
    last_name='User',
    is_staff=True
)
Token.objects.create(user=admin_user)

# Create regular user
regular_user = User.objects.create_user(
    username='john',
    email='john@company.com',
    password='john123',
    first_name='John',
    last_name='Doe'
)
Token.objects.create(user=regular_user)

print("✓ Users created successfully!")
print(f"Admin: admin@company.com / admin123")
print(f"User: john@company.com / john123")

exit()
```

## Step 9: Run Django Server

```bash
python manage.py runserver 0.0.0.0:8000
```

## Step 10: Test the Endpoints

Use curl or Postman to test:

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "token": "abc123token...",
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }
}
```

### Test Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "token": "def456token...",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "user"
  }
}
```

## File Structure After Setup

```
your_django_project/
├── manage.py
├── db.sqlite3
├── settings.py (UPDATED)
├── urls.py (UPDATED)
├── auth_api/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   ├── views.py (NEW - paste code here)
│   ├── urls.py (NEW - paste code here)
│   └── migrations/
│       └── __init__.py
└── [other apps...]
```

## Environment Variables (Optional)

If using environment variables:

```python
# settings.py

import os

CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
```

## Production Checklist

- [ ] Set `DEBUG = False`
- [ ] Update `ALLOWED_HOSTS`
- [ ] Set `SECRET_KEY` to a secure value
- [ ] Update CORS origins to production domain
- [ ] Use HTTPS in CORS origins
- [ ] Set `SECURE_SSL_REDIRECT = True`
- [ ] Use environment variables for sensitive data
- [ ] Enable CSRF protection
- [ ] Use production database (PostgreSQL, MySQL)
- [ ] Set up logging

## Troubleshooting

### CORS Error
If you get CORS errors, make sure:
1. `corsheaders` is in INSTALLED_APPS
2. `CorsMiddleware` is before other middleware
3. Frontend URL is in CORS_ALLOWED_ORIGINS

### 404 on Login Endpoint
Make sure:
1. Auth URLs are included in main urls.py
2. Path is exactly `/api/auth/login/`
3. Django server is running

### Token Not Returned
1. Check if user was authenticated
2. Verify Token model was created (run migrations)
3. Check Django logs for errors

### User Creation Fails
1. Ensure email field is unique
2. Check password meets requirements
3. Verify username doesn't already exist

**That's it! Your authentication system is ready.**
