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
      // Don't set error state for initial load - it's expected if not logged in
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
      if (!token) {
        throw new Error('Not authenticated - please log in first');
      }

      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${BACKEND_URL}/api/permissions/employee-permissions/update_permissions/`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          employee_id: employeeId,
          permission_ids: permissionIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update permissions: ${response.statusText}`);
      }

      const updated = await response.json();
      setEmployeePermissions((prev) =>
        prev.map((ep) => (ep.employee === employeeId ? updated : ep))
      );
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
