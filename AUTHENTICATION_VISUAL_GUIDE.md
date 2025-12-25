# Authentication System - Visual Guide

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     HR SYSTEM AUTHENTICATION                     │
└─────────────────────────────────────────────────────────────────┘

                          FRONTEND (React/Next.js)
                          ───────────────────────

    ┌──────────────────────────────────────────────────────────┐
    │                   Root Layout (layout.tsx)               │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │         AuthProvider (Context)                     │  │
    │  │  • Manages user state                              │  │
    │  │  • Stores tokens in localStorage                   │  │
    │  │  • Provides login/register/logout                  │  │
    │  │                                                     │  │
    │  │  ┌──────────────────────────────────────────────┐  │  │
    │  │  │    ProtectedLayout (Route Protection)       │  │  │
    │  │  │  • Checks if user is authenticated          │  │  │
    │  │  │  • Redirects unauthenticated users          │  │  │
    │  │  │                                              │  │  │
    │  │  │  ┌────────────────────────────────────┐     │  │  │
    │  │  │  │   Sidebar + Header + Pages        │     │  │  │
    │  │  │  │                                    │     │  │  │
    │  │  │  │  Pages Available:                  │     │  │  │
    │  │  │  │  • /login      (public)           │     │  │  │
    │  │  │  │  • /register   (public)           │     │  │  │
    │  │  │  │  • /dashboard  (protected)        │     │  │  │
    │  │  │  │  • /employees  (protected)        │     │  │  │
    │  │  │  │  • /attendance (protected)        │     │  │  │
    │  │  │  │  • /salary     (protected)        │     │  │  │
    │  │  │  │  • /reports    (protected)        │     │  │  │
    │  │  │  │  • /settings   (protected)        │     │  │  │
    │  │  │  │                                    │     │  │  │
    │  │  │  └────────────────────────────────────┘     │  │  │
    │  │  └──────────────────────────────────────────────┘  │  │
    │  └────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────────┘

                        BACKEND (Django REST)
                        ──────────────────────

    ┌──────────────────────────────────────────────────────────┐
    │                  API Endpoints                            │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  POST /api/auth/login/                             │  │
    │  │  ├─ Request:  { email, password }                 │  │
    │  │  └─ Response: { token, user }                     │  │
    │  └────────────────────────────────────────────────────┘  │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  POST /api/auth/register/                          │  │
    │  │  ├─ Request:  { email, first_name, password }    │  │
    │  │  └─ Response: { token, user }                     │  │
    │  └────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────────┘

                      DATABASE (Django ORM)
                      ─────────────────────

    ┌──────────────────────────────────────────────────────────┐
    │  Django Auth Models:                                      │
    │  • User (Django built-in)                                │
    │    ├─ id, username, email, password                      │
    │    ├─ first_name, last_name                              │
    │    ├─ is_staff, is_active                                │
    │    └─ ...                                                 │
    │  • Token (rest_framework.authtoken)                       │
    │    ├─ key (authentication token)                          │
    │    └─ user_id (foreign key)                              │
    └──────────────────────────────────────────────────────────┘
```

## Component Flow

### User Registration Flow

```
User Registration
         │
         ▼
┌─────────────────────────────────┐
│  /register Page                 │
│  • First Name input             │
│  • Last Name input              │
│  • Email input                  │
│  • Password input               │
│  • Confirm Password input       │
│  • Register button              │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Form Validation    │
    │ • Email format     │
    │ • Password length  │
    │ • Match confirm    │
    └────────┬───────────┘
             │
        ┌────┴────┐
     VALID   INVALID
        │       │
        ▼       ▼
      ✓      Error msg
        │
        ▼
┌────────────────────────────┐
│ POST /api/auth/register/   │
│ {email, first_name, etc}   │
└────────────┬───────────────┘
             │
        ┌────┴────────────────┐
     SUCCESS         FAILURE
        │                │
        ▼                ▼
    ✓ Token         Error msg
    ✓ User data    (email taken)
        │
        ▼
  Save to localStorage:
  • authToken
  • user object
        │
        ▼
  Redirect to /dashboard
```

### User Login Flow

```
User Login
    │
    ▼
┌──────────────────────┐
│  /login Page         │
│  • Email input       │
│  • Password input    │
│  • Login button      │
└──────────┬───────────┘
           │
           ▼
  ┌────────────────────┐
  │ Form Validation    │
  │ • Email required   │
  │ • Password required│
  └────────┬───────────┘
           │
      ┌────┴────┐
   VALID   INVALID
      │       │
      ▼       ▼
    ✓    Error msg
      │
      ▼
┌──────────────────────────┐
│ POST /api/auth/login/    │
│ {email, password}        │
└──────────┬───────────────┘
           │
      ┌────┴──────────────────┐
   SUCCESS              FAILURE
      │                    │
      ▼                    ▼
  ✓ Token          Invalid credentials
  ✓ User data         (error msg)
      │
      ▼
Save to localStorage:
• authToken
• user object
      │
      ▼
Redirect to /dashboard
```

### Protected Page Access Flow

```
User Tries to Access Protected Page
         │
         ▼
┌───────────────────────────┐
│ ProtectedLayout Checks    │
│ • Is user authenticated?  │
│ • Is route public?        │
└────────────┬──────────────┘
             │
        ┌────┴─────────────┐
    AUTHENTICATED     NOT AUTHENTICATED
        │                  │
        ▼                  ▼
   ✓ Render page      Redirect to /login
   ✓ Pass data        (show access denied)
```

### Logout Flow

```
User Clicks Logout
         │
         ▼
┌──────────────────────┐
│ Confirmation Dialog  │
│ "Are you sure?"      │
└──────────┬───────────┘
           │
      ┌────┴────┐
    YES       NO
     │         │
     ▼         ▼
  logout()  Continue
     │
     ▼
Clear localStorage:
• authToken
• user object
     │
     ▼
Clear sessionStorage:
• All data
     │
     ▼
  Redirect to /login
     │
     ▼
 Show success message
```

## Component Hierarchy

```
<html>
└─ <body>
   └─ <AuthProvider>           ← Auth Context
      └─ <ProtectedLayout>     ← Route Protection
         └─ <div class="flex">
            ├─ <Sidebar>       ← Navigation + Logout
            │  └─ User Info
            └─ <div>
               ├─ <Header>     ← Top bar
               └─ <main>
                  └─ <Route-specific page>
                     ├─ /login
                     ├─ /register
                     ├─ /dashboard
                     ├─ /employees
                     ├─ /attendance
                     └─ ... other pages
```

## Data Flow

### Authentication Context (AuthContext)

```
┌──────────────────────────────────────┐
│        AuthContext (Provides)         │
├──────────────────────────────────────┤
│ • user: User | null                  │
│ • token: string | null               │
│ • isLoading: boolean                 │
│ • isAuthenticated: boolean           │
│ • login(email, password)             │
│ • register(email, fname, lname, pwd) │
│ • logout()                           │
└──────────────────────────────────────┘
         │
         │ Used by useAuth() hook
         │
    ┌────┴──────────────────┐
    │                       │
    ▼                       ▼
┌─────────────┐     ┌──────────────┐
│   Login     │     │  Dashboard   │
│   Page      │     │  & Protected │
│             │     │  Pages       │
│ • useAuth() │     │              │
│ • get login │     │ • useAuth()  │
│ • get user  │     │ • get user   │
└─────────────┘     │ • check auth │
                    └──────────────┘
```

## Authentication Flow Diagram

```
┌─────────────────────────────────┐
│   Browser LocalStorage          │
│  ┌────────────────────────────┐ │
│  │ authToken: "abc123..."     │ │
│  │ user: {id, email, name...} │ │
│  └────────────────────────────┘ │
└────────────┬────────────────────┘
             │
             │ AuthContext retrieves
             ▼
┌─────────────────────────────────┐
│   React Component (useAuth)      │
│  • user = {id, email, name}     │
│  • token = "abc123..."          │
│  • isAuthenticated = true       │
└────────────┬────────────────────┘
             │
             │ Component renders based on
             │ authentication status
             │
    ┌────────┴──────────┐
    │                   │
    ▼                   ▼
Authenticated      Not Authenticated
    │                   │
    ▼                   ▼
Show Content        Redirect to Login
Show User Info      Show Login Form
Enable Actions      Request Credentials
```

## File Locations

```
Frontend:
─────────

hr-frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx
│   │       └─ User state management
│   │       └─ Token storage
│   │       └─ API calls to backend
│   │
│   └── components/
│       ├── Sidebar.tsx
│       │   └─ Display user info
│       │   └─ Logout button
│       │
│       └── ProtectedLayout.tsx
│           └─ Route protection
│           └─ Redirect logic
│
├── app/
│   ├── page.tsx
│   │   └─ Redirect to dashboard/login
│   │
│   ├── layout.tsx
│   │   └─ AuthProvider wrapper
│   │   └─ ProtectedLayout wrapper
│   │
│   ├── login/
│   │   └── page.tsx
│   │       └─ Login form
│   │       └─ Call useAuth().login()
│   │
│   ├── register/
│   │   └── page.tsx
│   │       └─ Register form
│   │       └─ Call useAuth().register()
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │       └─ Protected page
│   │       └─ Show user welcome
│   │
│   └── ... (other protected pages)


Backend:
────────

django_project/
├── settings.py
│   └─ Add auth_api to INSTALLED_APPS
│   └─ Configure REST_FRAMEWORK
│   └─ Add CORS settings
│
├── urls.py
│   └─ Include auth_api.urls
│
└── auth_api/
    ├── views.py
    │   ├─ login_view()
    │   │   └─ POST /api/auth/login/
    │   │   └─ Return token + user
    │   │
    │   └─ register_view()
    │       └─ POST /api/auth/register/
    │       └─ Create user + Return token
    │
    └── urls.py
        ├─ path('login/', login_view)
        └─ path('register/', register_view)
```

## Browser Storage

### LocalStorage (Persistent)
```
localStorage:
{
  "authToken": "abc123def456...",
  "user": "{\"id\":1,\"email\":\"user@company.com\",...}"
}
```

### SessionStorage (Cleared on logout)
```
sessionStorage:
{
  // Cleared on logout
}
```

## Security Features Visual

```
┌──────────────────────────────────────────┐
│         SECURITY LAYERS                  │
└──────────────────────────────────────────┘

Layer 1: Password Security
├─ Django PBKDF2 hashing
├─ Minimum 6 characters
└─ No plaintext storage

Layer 2: Token Security
├─ Unique token per user
├─ Stored in localStorage
└─ Sent in API headers

Layer 3: Route Protection
├─ Client-side checks
├─ Auto-redirect on fail
└─ Loading state validation

Layer 4: CORS Protection
├─ Whitelist origins
├─ Frontend restricted
└─ Backend validates

Layer 5: Session Management
├─ Token-based auth
├─ Stateless backend
└─ Client cleanup on logout
```

## Error Handling

```
Login/Register Error Cases:

┌─────────────────────────────────────────┐
│ Frontend Validation Errors              │
├─────────────────────────────────────────┤
│ ✗ Empty email/password                  │
│ ✗ Invalid email format                  │
│ ✗ Password too short                    │
│ ✗ Passwords don't match                 │
│ Result: Show error message              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Backend Validation Errors               │
├─────────────────────────────────────────┤
│ ✗ Email not found (login)               │
│ ✗ Invalid password                      │
│ ✗ Email already registered              │
│ ✗ Weak password                         │
│ Result: Return HTTP 400/401             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Success Response                        │
├─────────────────────────────────────────┤
│ ✓ Token generated                       │
│ ✓ User data returned                    │
│ ✓ Saved to localStorage                 │
│ ✓ Redirect to dashboard                 │
└─────────────────────────────────────────┘
```

---

**This visual guide shows how all components work together to create a secure authentication system.**
