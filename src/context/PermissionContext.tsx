'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:8080';

export interface Permission {
  id: number;
  permission_id: string;
  name: string;
  description: string;
  category: string;
  is_admin_only: boolean;
}

export interface EmployeePermissions {
  id: number;
  employee: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  permissions: Permission[];
  updated_at: string;
}

interface PermissionContextType {
  allPermissions: Permission[];
  employeePermissions: EmployeePermissions[];
  loading: boolean;
  error: string | null;
  updateEmployeePermissions: (employeeId: number, permissionIds: number[]) => Promise<void>;
  getEmployeePermissions: (employeeId: number) => Promise<Permission[]>;
  canAccess: (employeeId: number, permissionId: string) => Promise<boolean>;
  fetchPermissionsFromBackend: () => Promise<void>;
  fetchEmployeePermissionsFromBackend: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [employeePermissions, setEmployeePermissions] = useState<EmployeePermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      // Try multiple storage formats
      let token = localStorage.getItem('token');
      if (token) return token;
      
      token = localStorage.getItem('access');
      if (token) return token;
      
      const auth = localStorage.getItem('auth');
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          return parsed.token || parsed.access;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  // Fetch all available permissions
  const fetchPermissionsFromBackend = async () => {
    try {
      const token = getAuthToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/permissions/permissions/`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Not authenticated - permissions will load when user logs in');
          setError(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch permissions: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle paginated response
      const permissions = Array.isArray(data.results) ? data.results : data;
      setAllPermissions(permissions);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permissions';
      console.warn('Warning fetching permissions:', message);
      // Use mock permissions as fallback
      const mockPermissions: Permission[] = [
        { id: 1, permission_id: 'view_dashboard', name: 'View Dashboard', description: 'Access the main dashboard', category: 'dashboard', is_admin_only: false },
        { id: 2, permission_id: 'view_employees', name: 'View Employees', description: 'View employee list and details', category: 'employees', is_admin_only: false },
        { id: 3, permission_id: 'manage_attendance', name: 'Manage Attendance', description: 'View and manage attendance records', category: 'attendance', is_admin_only: false },
        { id: 4, permission_id: 'view_salary', name: 'View Salary', description: 'View salary information', category: 'salary', is_admin_only: false },
        { id: 5, permission_id: 'manage_payroll', name: 'Manage Payroll', description: 'Manage payroll and salary slips', category: 'salary', is_admin_only: true },
        { id: 6, permission_id: 'manage_deductions', name: 'Manage Deductions', description: 'Create and manage admin deductions', category: 'salary', is_admin_only: true },
        { id: 7, permission_id: 'send_messages', name: 'Send Messages', description: 'Send messages to employees', category: 'messaging', is_admin_only: false },
        { id: 8, permission_id: 'manage_recruitment', name: 'Manage Recruitment', description: 'Manage job postings and candidates', category: 'recruitment', is_admin_only: true },
        { id: 9, permission_id: 'view_cafeteria', name: 'View Cafeteria', description: 'View cafeteria menu and orders', category: 'cafeteria', is_admin_only: false },
        { id: 10, permission_id: 'manage_tickets', name: 'Manage Support Tickets', description: 'View and manage support tickets', category: 'support', is_admin_only: false },
        { id: 11, permission_id: 'view_reports', name: 'View Reports', description: 'Access reports and analytics', category: 'reports', is_admin_only: false },
        { id: 12, permission_id: 'manage_permissions', name: 'Manage Permissions', description: 'Manage employee permissions', category: 'admin', is_admin_only: true },
        { id: 13, permission_id: 'view_performance', name: 'View Performance', description: 'View performance metrics', category: 'performance', is_admin_only: false },
        { id: 14, permission_id: 'manage_settings', name: 'Manage Settings', description: 'Manage system settings', category: 'admin', is_admin_only: true },
        { id: 15, permission_id: 'manage_cafeteria', name: 'Manage Cafeteria', description: 'Manage cafeteria menu and orders', category: 'cafeteria', is_admin_only: true },
      ];
      setAllPermissions(mockPermissions);
      console.log('Using mock permissions as fallback:', mockPermissions);
    }
  };

  // Fetch employee permissions from backend
  const fetchEmployeePermissionsFromBackend = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/permissions/employee-permissions/`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Not authenticated');
          setError(null);
          setEmployeePermissions([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch employee permissions: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle paginated response
      const perms = Array.isArray(data.results) ? data.results : data;
      setEmployeePermissions(perms);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employee permissions';
      console.warn('Warning fetching employee permissions:', message);
      setEmployeePermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Update permissions for an employee
  const updateEmployeePermissions = async (employeeId: number, permissionIds: number[]) => {
    try {
      const token = getAuthToken();
      
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/permissions/employee-permissions/update_permissions/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            employee_id: employeeId,
            permission_ids: permissionIds,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setEmployeePermissions((prev) =>
            prev.map((ep) => (ep.employee === employeeId ? updated : ep))
          );
          setError(null);
          return;
        }
      } catch (fetchErr) {
        console.warn('Backend update failed, using local fallback:', fetchErr);
      }

      // Fallback: Update permissions locally without backend
      const selectedPermissions = allPermissions.filter(p => permissionIds.includes(p.id));
      const updatedPermissions: EmployeePermissions = {
        id: Date.now(),
        employee: employeeId,
        employee_id: employeeId,
        employee_name: 'Employee',
        employee_email: 'employee@company.com',
        permissions: selectedPermissions,
        updated_at: new Date().toISOString(),
      };

      setEmployeePermissions((prev) => {
        const index = prev.findIndex(ep => ep.employee === employeeId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedPermissions;
          return updated;
        }
        return [...prev, updatedPermissions];
      });

      console.log('Permissions updated locally for employee:', employeeId, selectedPermissions);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(message);
      console.error('Error updating permissions:', message);
      throw err;
    }
  };

  // Get permissions for a specific employee
  const getEmployeePermissions = async (employeeId: number): Promise<Permission[]> => {
    try {
      const found = employeePermissions.find((ep) => ep.employee === employeeId);
      if (found) {
        return found.permissions;
      }

      // Fetch if not found in state
      const token = getAuthToken();
      const response = await fetch(
        `${BACKEND_URL}/api/permissions/employee-permissions/?employee=${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch employee permissions: ${response.statusText}`);
      }

      const data = await response.json();
      const perms = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [data];
      return perms.length > 0 ? perms[0].permissions : [];
    } catch (err) {
      console.error('Error getting employee permissions:', err);
      return [];
    }
  };

  // Check if user has specific permission
  const canAccess = async (employeeId: number, permissionId: string): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return false;
      }

      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(
        `${BACKEND_URL}/api/permissions/employee-permissions/check_permission/?permission_id=${permissionId}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.has_permission === true;
    } catch (err) {
      console.warn('Error checking permission:', err);
      return false;
    }
  };

  // Load permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      await Promise.all([
        fetchPermissionsFromBackend(),
        fetchEmployeePermissionsFromBackend(),
      ]);
    };

    loadPermissions();
  }, []);

  const value: PermissionContextType = {
    allPermissions,
    employeePermissions,
    loading,
    error,
    updateEmployeePermissions,
    getEmployeePermissions,
    canAccess,
    fetchPermissionsFromBackend,
    fetchEmployeePermissionsFromBackend,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
