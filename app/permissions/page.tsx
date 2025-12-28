'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions, Permission, EmployeePermissions } from '@/context/PermissionContext';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

const BACKEND_URL = 'http://localhost:8080';

export default function PermissionsPage() {
  const { user } = useAuth();
  const { 
    allPermissions, 
    employeePermissions, 
    loading, 
    error,
    updateEmployeePermissions,
    fetchEmployeePermissionsFromBackend 
  } = usePermissions();
  const { addNotification } = useNotification();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed.token;
      }
    }
    return null;
  };

  // Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Use mock employees directly since backend doesn't have dedicated employees endpoint
        const mockEmployees = [
          { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@company.com', username: 'john_doe' },
          { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@company.com', username: 'jane_smith' },
          { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@company.com', username: 'mike_johnson' },
          { id: 4, first_name: 'Sarah', last_name: 'Davis', email: 'sarah@company.com', username: 'sarah_davis' },
          { id: 5, first_name: 'Tom', last_name: 'Wilson', email: 'tom@company.com', username: 'tom_wilson' },
        ];
        console.log('Setting employees:', mockEmployees);
        setEmployees(mockEmployees);
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    };

    fetchEmployees();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">Only admins can manage permissions.</p>
        <Link href="/dashboard" className="text-blue-600 mt-4 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Loading permissions...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  const categories = ['all', ...Array.from(new Set(allPermissions.map(p => p.category)))];

  const filteredPermissions = allPermissions.filter(p => {
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectEmployee = (employeeId: number) => {
    setSelectedEmployee(employeeId);
    const empPerms = employeePermissions.find(ep => ep.employee === employeeId);
    setSelectedPermissions(empPerms ? empPerms.permissions.map(p => p.id) : []);
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) {
      alert('❌ Please select an employee first');
      return;
    }

    setSaving(true);
    try {
      await updateEmployeePermissions(selectedEmployee, selectedPermissions);
      
      const employee = employees.find(e => e.id === selectedEmployee);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee';
      
      addNotification({
        title: '🔐 Permissions Updated',
        message: `Permissions have been updated for ${employeeName}`,
        type: 'success',
        forUser: employee?.email,
      });

      alert('✓ Permissions saved successfully for ' + employeeName);
      console.log('Permissions saved for employee:', selectedEmployee, selectedPermissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save permissions';
      console.error('Error saving permissions:', err);
      alert('⚠️ Permissions updated locally. Backend sync may require additional setup.\n\nError: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (template: 'standard' | 'restricted' | 'advanced') => {
    if (!selectedEmployee) {
      alert('❌ Please select an employee first');
      return;
    }

    const templates: Record<string, number[]> = {
      standard: allPermissions
        .filter(p => !p.is_admin_only)
        .map(p => p.id),
      restricted: allPermissions
        .filter(p => p.category === 'attendance' || p.category === 'salary')
        .map(p => p.id),
      advanced: allPermissions.map(p => p.id),
    };

    setSelectedPermissions(templates[template] || []);
  };

  const grantedCount = selectedPermissions.length;
  const totalCount = allPermissions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-block">← Back to Dashboard</Link>
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🔐 Manage Permissions</h1>
        <p className="text-gray-600 mb-8">Control access to features for each employee</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Employee Selection Sidebar */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employees</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedEmployee === emp.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                  <div className={`text-sm ${selectedEmployee === emp.id ? 'text-blue-100' : 'text-gray-600'}`}>
                    {emp.email}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Manager */}
          <div className="lg:col-span-3">
            {selectedEmployee ? (
              <>
                {/* Templates */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Templates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleApplyTemplate('restricted')}
                      className="p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 text-left transition"
                    >
                      <div className="font-semibold text-red-700">🔒 Restricted</div>
                      <div className="text-sm text-red-600">5 basic permissions</div>
                    </button>
                    <button
                      onClick={() => handleApplyTemplate('standard')}
                      className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 text-left transition"
                    >
                      <div className="font-semibold text-blue-700">✓ Standard</div>
                      <div className="text-sm text-blue-600">All employee features</div>
                    </button>
                    <button
                      onClick={() => handleApplyTemplate('advanced')}
                      className="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 text-left transition"
                    >
                      <div className="font-semibold text-green-700">⭐ Advanced</div>
                      <div className="text-sm text-green-600">All permissions</div>
                    </button>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {filteredPermissions.map(permission => (
                      <label
                        key={permission.id}
                        className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          className="mt-1 mr-3 w-4 h-4 text-blue-500 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{permission.name}</div>
                          <div className="text-sm text-gray-600">{permission.description}</div>
                          <div className="text-xs mt-2">
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                              {permission.category}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      ✓ Permission Summary: {grantedCount} out of {totalCount} features
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredPermissions
                        .filter(p => selectedPermissions.includes(p.id))
                        .map(p => (
                          <span key={p.id} className="bg-blue-200 text-blue-800 text-xs px-3 py-1 rounded-full">
                            {p.name}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                      {saving ? 'Saving...' : '💾 Save Permissions'}
                    </button>
                    <button
                      onClick={() => setSelectedPermissions([])}
                      className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-600">Select an employee to manage their permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
