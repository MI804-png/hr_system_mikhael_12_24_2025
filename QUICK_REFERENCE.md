# 🚀 Quick Reference - Authentication System

## File Locations

| File | Purpose |
|------|---------|
| `src/context/AuthContext.tsx` | Global auth state management |
| `app/login/page.tsx` | Login form page |
| `app/register/page.tsx` | Registration form page |
| `app/dashboard/page.tsx` | Main dashboard (protected) |
| `src/components/ProtectedLayout.tsx` | Route protection middleware |
| `app/layout.tsx` | Root layout (AuthProvider wrapper) |
| `src/components/Sidebar.tsx` | Navigation (updated with auth) |

## API Endpoints (Django Backend)

```
POST /api/auth/login/
├─ Email: user@company.com
├─ Password: password123
└─ Response: { token, user }

POST /api/auth/register/
├─ Email: user@company.com
├─ First Name: John
├─ Last Name: Doe
├─ Password: password123
└─ Response: { token, user }
```

## Demo Credentials

```
Email:    admin@company.com
Password: admin123
```

## Route Overview

| Route | Public? | Purpose |
|-------|---------|---------|
| `/` | No | Redirect to dashboard/login |
| `/login` | Yes | Login form |
| `/register` | Yes | Registration form |
| `/dashboard` | No | Main landing page |
| `/employees` | No | Employee management |
| `/attendance` | No | Attendance tracking |
| `/salary` | No | Salary management |
| `/recruitment` | No | Job recruitment |
| `/payroll` | No | Payroll processing |
| `/performance` | No | Performance reviews |
| `/reports` | No | Report generation |
| `/settings` | No | System settings |

## Quick Start Commands

### Frontend
```bash
cd hr-frontend
npm run dev
# Opens http://localhost:3000
```

### Backend (Django)
```bash
# Install packages
pip install djangorestframework django-cors-headers

# Configure Django
# 1. Update settings.py
# 2. Update urls.py
# 3. Create auth_api app
# 4. Add views and urls

# Run migrations
python manage.py migrate

# Create test users
python manage.py shell
# Paste user creation code from guide

# Run server
python manage.py runserver 0.0.0.0:8000
```

## useAuth() Hook

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const {
    user,              // Current user object
    token,             // Auth token
    isLoading,         // Loading state
    isAuthenticated,   // True if logged in
    login,             // login(email, password)
    register,          // register(email, fname, lname, pwd)
    logout             // logout()
  } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return <p>Welcome {user?.first_name}!</p>;
}
```

## localStorage Keys

```javascript
// After login, these are saved:
localStorage.authToken    // "token_string_here"
localStorage.user         // '{"id":1,"email":"...","first_name":"..."}'

// On logout, these are cleared:
localStorage.removeItem('authToken');
localStorage.removeItem('user');
sessionStorage.clear();
```

## Response Format

### Successful Login/Register
```json
{
  "token": "abc123def456...",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }
}
```

### Error Response
```json
{
  "detail": "Invalid email or password"
}
```

## Protected Component Example

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export default function ProtectedPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return (
    <div>
      <h1>Welcome {user?.first_name}</h1>
      {/* Your protected content */}
    </div>
  );
}
```

## Django Settings Additions

```python
# settings.py

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'auth_api',  # Your auth app
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... rest of middleware
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```

## Testing Login with curl

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "admin123"
  }'
```

## Testing Protected API Endpoint

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  http://localhost:8000/api/employees/
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Add frontend URL to CORS_ALLOWED_ORIGINS |
| Login fails | Check Django server is running on :8000 |
| Token not saving | Verify localStorage is enabled |
| Redirect loop | Clear localStorage, check AuthContext |
| 404 on endpoint | Check URLs are included correctly |
| User not created | Verify migrations were run |

## Status Check Commands

```bash
# Check if Django server is running
curl http://localhost:8000/api/auth/login/

# Check if frontend is running
curl http://localhost:3000

# Check if token works
curl -H "Authorization: Token abc123" \
  http://localhost:8000/api/employees/
```

## Documentation Files

- `README_AUTHENTICATION.md` - This summary
- `AUTHENTICATION_COMPLETE.md` - Full overview
- `AUTHENTICATION_SETUP.md` - Detailed setup guide
- `DJANGO_BACKEND_SETUP.md` - Django implementation
- `AUTHENTICATION_VISUAL_GUIDE.md` - Diagrams and flows
- `BACKEND_AUTH_ENDPOINTS.py` - Example code

## Security Checklist

- ✅ Passwords hashed (Django PBKDF2)
- ✅ Tokens unique per user
- ✅ Routes protected with redirect
- ✅ CORS whitelist enabled
- ✅ Input validation (email, password)
- ✅ Logout clears all storage
- ✅ Session persists on refresh
- ✅ Error messages generic (no leaking info)

---

**Everything is ready! Start with:**
1. Frontend: `npm run dev`
2. Backend: Setup Django (see DJANGO_BACKEND_SETUP.md)
3. Test: Use demo credentials to login

**Questions? Check the documentation files!**
