'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Sample employee data (same as in employees page)
  const [employees] = useState([
    { id: 1, code: 'EMP-0001', name: 'John Doe', position: 'Senior Developer', department: 'Engineering', email: 'john@company.com', joinDate: '2021-03-15' },
    { id: 2, code: 'EMP-0002', name: 'Jane Smith', position: 'Project Manager', department: 'Management', email: 'jane@company.com', joinDate: '2020-07-22' },
    { id: 3, code: 'EMP-0003', name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources', email: 'mike@company.com', joinDate: '2019-11-10' },
    { id: 4, code: 'EMP-0004', name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering', email: 'sarah@company.com', joinDate: '2022-01-10' },
    { id: 5, code: 'EMP-0005', name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design', email: 'tom@company.com', joinDate: '2021-05-18' },
  ]);

  // Load pending approvals count
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))].sort();

  useEffect(() => {
    // Count pending availability requests
    const saved = localStorage.getItem('availabilityRequests');
    if (saved) {
      try {
        const requests = JSON.parse(saved);
        const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
        setPendingApprovalsCount(pendingCount);
      } catch (e) {
        console.error('Failed to load pending requests:', e);
      }
    }
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">HR Management System Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Total Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{employees.length}</p>
          <p className="text-xs text-gray-500 mt-2">Active in system</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-medium">Departments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{departments.length}</p>
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            {departments.map(dept => (
              <span key={dept} className="block">• {dept}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm font-medium">Attendance Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">94%</p>
          <p className="text-xs text-green-600 mt-2">↑ 3% from yesterday</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
          <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{pendingApprovalsCount}</p>
          <button 
            onClick={() => router.push('/availability')}
            className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 font-medium cursor-pointer"
          >
            → View requests
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/employees')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-center cursor-pointer">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm font-medium text-gray-900">Add Employee</p>
          </button>
          <button 
            onClick={() => router.push('/attendance')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition text-center cursor-pointer">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm font-medium text-gray-900">Attendance</p>
          </button>
          <button 
            onClick={() => router.push('/payroll')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition text-center cursor-pointer">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm font-medium text-gray-900">Payroll</p>
          </button>
          <button 
            onClick={() => router.push('/reports')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-center cursor-pointer">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium text-gray-900">Reports</p>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">👤</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New Employee Added</p>
              <p className="text-sm text-gray-600">Sarah Johnson joined Engineering department</p>
              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4 pb-4 border-b">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">✓</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Payroll Processed</p>
              <p className="text-sm text-gray-600">Monthly payroll for {employees.length} employees processed successfully</p>
              <p className="text-xs text-gray-500 mt-1">1 day ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">⭐</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Performance Review Submitted</p>
              <p className="text-sm text-gray-600">Q4 performance reviews submitted for review</p>
              <p className="text-xs text-gray-500 mt-1">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
