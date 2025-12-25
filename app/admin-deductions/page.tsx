'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

interface AdminDeduction {
  id: number;
  employee: number;
  employee_name: string;
  amount: number;
  reason: string;
  status: 'pending' | 'applied' | 'cancelled';
  month: number | null;
  year: number | null;
  created_by: number;
  created_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function AdminDeductions() {
  const { user } = useAuth();
  const [deductions, setDeductions] = useState<AdminDeduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    reason: '',
    month: '',
    year: new Date().getFullYear().toString(),
  });

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('access');
    }
    return null;
  };

  // Fetch deductions and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Fetch employees
        const empRes = await fetch('http://localhost:8080/api/employees/', { 
          headers,
          credentials: 'include' 
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          // Handle both paginated and non-paginated responses
          const empList = Array.isArray(empData) ? empData : (empData.results || []);
          setEmployees(empList);
        } else if (empRes.status !== 401) {
          console.error('Failed to fetch employees:', empRes.status);
        }

        // Fetch deductions
        const deductRes = await fetch('http://localhost:8080/api/salary/admin-deductions/', {
          headers,
          credentials: 'include',
        });

        if (deductRes.ok) {
          const deductData = await deductRes.json();
          setDeductions(deductData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee || !formData.amount || !formData.reason) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const payload = {
        employee: parseInt(formData.employee),
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        month: formData.month ? parseInt(formData.month) : null,
        year: formData.year ? parseInt(formData.year) : null,
      };

      const url = editingId
        ? `http://localhost:8080/api/salary/admin-deductions/${editingId}/`
        : 'http://localhost:8080/api/salary/admin-deductions/';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save deduction');
      }

      const savedDeduction = await response.json();

      if (editingId) {
        setDeductions(deductions.map(d => (d.id === editingId ? savedDeduction : d)));
        setEditingId(null);
      } else {
        setDeductions([savedDeduction, ...deductions]);
      }

      // Reset form
      setFormData({
        employee: '',
        amount: '',
        reason: '',
        month: '',
        year: new Date().getFullYear().toString(),
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error saving deduction:', err);
      setError(err instanceof Error ? err.message : 'Failed to save deduction');
    }
  };

  const handleApprove = async (deductionId: number) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:8080/api/salary/admin-deductions/${deductionId}/approve/`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve deduction');
      }

      const updated = await response.json();
      setDeductions(deductions.map(d => (d.id === deductionId ? updated : d)));
    } catch (err) {
      console.error('Error approving deduction:', err);
      setError('Failed to approve deduction');
    }
  };

  const handleCancel = async (deductionId: number) => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:8080/api/salary/admin-deductions/${deductionId}/cancel/`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel deduction');
      }

      const updated = await response.json();
      setDeductions(deductions.map(d => (d.id === deductionId ? updated : d)));
    } catch (err) {
      console.error('Error cancelling deduction:', err);
      setError('Failed to cancel deduction');
    }
  };

  const handleEdit = (deduction: AdminDeduction) => {
    setFormData({
      employee: deduction.employee.toString(),
      amount: deduction.amount.toString(),
      reason: deduction.reason,
      month: deduction.month?.toString() || '',
      year: deduction.year?.toString() || new Date().getFullYear().toString(),
    });
    setEditingId(deduction.id);
    setShowForm(true);
  };

  const handleDelete = async (deductionId: number) => {
    if (confirm('Are you sure you want to delete this deduction?')) {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `http://localhost:8080/api/salary/admin-deductions/${deductionId}/`,
          {
            method: 'DELETE',
            headers,
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete deduction');
        }

        setDeductions(deductions.filter(d => d.id !== deductionId));
      } catch (err) {
        console.error('Error deleting deduction:', err);
        setError('Failed to delete deduction');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      applied: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-8 text-center">
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Deductions</h1>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  employee: '',
                  amount: '',
                  reason: '',
                  month: '',
                  year: new Date().getFullYear().toString(),
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + New Deduction
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Deduction' : 'Create New Deduction'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee *
                  </label>
                  <select
                    value={formData.employee}
                    onChange={(e) =>
                      setFormData({ ...formData, employee: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user.first_name} {emp.user.last_name} ({emp.user.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month (Optional)
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All months</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleString('default', {
                          month: 'long',
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the reason for this deduction (mandatory)"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'} Deduction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading deductions...</p>
          </div>
        ) : deductions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No deductions yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {deductions.map((deduction) => (
              <div
                key={deduction.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee</p>
                    <p className="font-semibold text-gray-900">
                      {deduction.employee_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-lg text-red-600">
                      PKR {deduction.amount.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                        deduction.status
                      )}`}
                    >
                      {deduction.status.charAt(0).toUpperCase() +
                        deduction.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Reason:</p>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded">
                    {deduction.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm text-gray-600">
                  {deduction.month && (
                    <div>
                      <span className="font-medium">Month:</span>{' '}
                      {deduction.month}
                    </div>
                  )}
                  {deduction.year && (
                    <div>
                      <span className="font-medium">Year:</span>{' '}
                      {deduction.year}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created by:</span>{' '}
                    {deduction.created_by_name}
                  </div>
                  {deduction.approved_by_name && (
                    <div>
                      <span className="font-medium">Approved by:</span>{' '}
                      {deduction.approved_by_name}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {deduction.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(deduction.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleEdit(deduction)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleCancel(deduction.id)}
                    className={`px-4 py-2 rounded text-sm ${
                      deduction.status === 'cancelled'
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    disabled={deduction.status === 'cancelled'}
                  >
                    {deduction.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleDelete(deduction.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
