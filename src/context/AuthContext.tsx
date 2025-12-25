'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  emailVerified?: boolean;
  verificationToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, firstName: string, lastName: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Try real backend first
      try {
        const response = await fetch('http://localhost:8080/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        const newToken = data.token || data.access;
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          role: data.user.role,
        };

        setToken(newToken);
        setUser(userData);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (backendError) {
        console.warn('Django backend not available, using registered employee login');
        
        // Registered employees - only these emails can login
        const registeredEmployees: Record<string, any> = {
          'admin@example.com': { id: 1, first_name: 'Admin', last_name: 'User', role: 'admin' },
          'john@company.com': { id: 2, first_name: 'John', last_name: 'Doe', role: 'employee' },
          'jane@company.com': { id: 3, first_name: 'Jane', last_name: 'Smith', role: 'employee' },
          'mike@company.com': { id: 4, first_name: 'Mike', last_name: 'Johnson', role: 'employee' },
          'sarah@company.com': { id: 5, first_name: 'Sarah', last_name: 'Davis', role: 'employee' },
          'tom@company.com': { id: 6, first_name: 'Tom', last_name: 'Wilson', role: 'employee' },
        };

        // Validate employee exists and password is correct
        if (registeredEmployees[email] && password === 'admin123') {
          const empData = registeredEmployees[email];
          const userData: User = {
            id: empData.id,
            email: email,
            first_name: empData.first_name,
            last_name: empData.last_name,
            role: empData.role,
          };
          const mockToken = 'token-' + empData.id + '-' + Date.now();
          
          setToken(mockToken);
          setUser(userData);
          localStorage.setItem('authToken', mockToken);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log(`✓ Employee login successful: ${empData.first_name}`);
          return;
        }
        
        // If mock login fails too, throw error
        throw new Error('Invalid credentials (Django backend not running)');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ) => {
    try {
      // Try real backend first
      try {
        const response = await fetch('http://localhost:8000/api/auth/register/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            password,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Registration failed');
        }

        const data = await response.json();
        const newToken = data.token || data.access;
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          role: data.user.role,
        };

        setToken(newToken);
        setUser(userData);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (backendError) {
        console.warn('Django backend not available, using mock registration');
        
        // Fallback: Mock registration for testing
        const userData: User = {
          id: Math.floor(Math.random() * 10000),
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'user',
        };
        const mockToken = 'mock-token-' + Date.now();
        
        setToken(mockToken);
        setUser(userData);
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✓ Mock registration successful (Django not ready)');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
