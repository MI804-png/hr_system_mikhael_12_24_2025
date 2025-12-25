'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

interface SalaryRecord {
  id: number;
  employeeName: string;
  position: string;
  department: string;
  salaryType: 'monthly' | 'hourly';
  baseSalary: number;
  hourlyRate?: number;
  workingHoursPerMonth?: number;
  bonus: number;
}

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

export default function Salary() {
  const { user } = useAuth();
  const { orders } = useData();
  const [adminDeductions, setAdminDeductions] = useState<AdminDeduction[]>([]);

  const [salaries, setSalaries] = useState<SalaryRecord[]>([
    { id: 1, employeeName: 'John Doe', position: 'Senior Developer', department: 'Engineering', salaryType: 'monthly', baseSalary: 85000, bonus: 5000 },
    { id: 2, employeeName: 'Jane Smith', position: 'Project Manager', department: 'Management', salaryType: 'hourly', hourlyRate: 500, workingHoursPerMonth: 160, baseSalary: 80000, bonus: 0 },
    { id: 3, employeeName: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources', salaryType: 'monthly', baseSalary: 75000, bonus: 4000 },
    { id: 4, employeeName: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering', salaryType: 'hourly', hourlyRate: 450, workingHoursPerMonth: 160, baseSalary: 72000, bonus: 0 },
  ]);

  // Fetch admin deductions from backend
  useEffect(() => {
    const fetchAdminDeductions = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access');
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:8080/api/salary/admin-deductions/', {
          headers,
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAdminDeductions(data);
        }
      } catch (err) {
        console.error('Error fetching admin deductions:', err);
      }
    };

    fetchAdminDeductions();
  }, []);

  // Convert picked-up orders to food deductions
  const foodDeductions = useMemo(() => 
    orders
      .filter(o => o.status === 'picked-up')
      .map((order, idx) => ({
        id: idx + 1,
        employeeName: order.employeeName,
        employeeEmail: order.employeeEmail,
        itemName: order.items[0]?.itemName || 'Order',
        quantity: order.items[0]?.quantity || 1,
        pricePerItem: order.totalPrice / (order.items[0]?.quantity || 1),
        totalPrice: order.totalPrice,
        orderDate: order.orderDate,
        status: 'picked-up' as const,
      }))
  , [orders]);

  const [salaryFilter, setSalaryFilter] = useState<'all' | 'monthly' | 'hourly'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    position: '',
    department: '',
    salaryType: 'monthly' as 'monthly' | 'hourly',
    baseSalary: '',
    hourlyRate: '',
    workingHoursPerMonth: '160',
    bonus: '',
  });

  // Filter salaries
  const filteredSalaries = useMemo(() => {
    if (salaryFilter === 'all') return salaries;
    return salaries.filter(s => s.salaryType === salaryFilter);
  }, [salaries, salaryFilter]);

  // Calculate totals
  const totalPayroll = filteredSalaries.reduce((sum, s) => sum + s.baseSalary + s.bonus, 0);
  const avgSalary = filteredSalaries.length > 0 ? Math.round(totalPayroll / filteredSalaries.length) : 0;
  const highestSalary = filteredSalaries.length > 0 ? Math.max(...filteredSalaries.map(s => s.baseSalary)) : 0;
  const lowestSalary = filteredSalaries.length > 0 ? Math.min(...filteredSalaries.map(s => s.baseSalary)) : 0;

  const handleAddSalary = () => {
    if (!formData.employeeName || !formData.baseSalary) {
      alert('❌ Please fill in all required fields');
      return;
    }

    const newRecord: SalaryRecord = {
      id: Math.max(...salaries.map(s => s.id), 0) + 1,
      employeeName: formData.employeeName,
      position: formData.position,
      department: formData.department,
      salaryType: formData.salaryType,
      baseSalary: parseInt(formData.baseSalary),
      hourlyRate: formData.salaryType === 'hourly' ? parseInt(formData.hourlyRate) : undefined,
      workingHoursPerMonth: formData.salaryType === 'hourly' ? parseInt(formData.workingHoursPerMonth) : undefined,
      bonus: parseInt(formData.bonus) || 0,
    };

    if (editingId) {
      setSalaries(salaries.map(s => s.id === editingId ? newRecord : s));
      alert('✓ Salary record updated successfully');
      setEditingId(null);
    } else {
      setSalaries([...salaries, newRecord]);
      alert('✓ Salary record added successfully');
    }

    setFormData({ 
      employeeName: '', 
      position: '', 
      department: '', 
      salaryType: 'monthly',
      baseSalary: '', 
      hourlyRate: '',
      workingHoursPerMonth: '160',
      bonus: '' 
    });
    setShowAddForm(false);
  };

  const handleEditSalary = (id: number) => {
    const salary = salaries.find(s => s.id === id);
    if (salary) {
      setFormData({
        employeeName: salary.employeeName,
        position: salary.position,
        department: salary.department,
        salaryType: salary.salaryType,
        baseSalary: String(salary.baseSalary),
        hourlyRate: String(salary.hourlyRate || ''),
        workingHoursPerMonth: String(salary.workingHoursPerMonth || '160'),
        bonus: String(salary.bonus),
      });
      setEditingId(id);
      setSelectedSalary(null);
    }
  };

  const handleDeleteSalary = (id: number, name: string) => {
    if (confirm(`Delete salary record for "${name}"? This action cannot be undone.`)) {
      setSalaries(salaries.filter(s => s.id !== id));
      setSelectedSalary(null);
      alert(`✓ Salary record for "${name}" deleted successfully`);
    }
  };

  const handleViewSalary = (id: number) => {
    const salary = salaries.find(s => s.id === id);
    setSelectedSalary(salary || null);
    setEditingId(null);
  };

  // Calculate employee's food deductions
  const employeeFoodDeductions = useMemo(() => {
    if (!user) return [];
    const employeeFullName = `${user.first_name} ${user.last_name}`;
    return foodDeductions.filter(d => d.employeeName === employeeFullName);
  }, [foodDeductions, user]);

  const totalFoodDeductions = useMemo(() => {
    return employeeFoodDeductions.reduce((sum, d) => d.status === 'picked-up' ? sum + d.totalPrice : sum, 0);
  }, [employeeFoodDeductions]);

  // Calculate employee's applied admin deductions
  const employeeAppliedDeductions = useMemo(() => {
    if (!user) return 0;
    return adminDeductions
      .filter(d => d.employee_name === `${user.first_name} ${user.last_name}` && d.status === 'applied')
      .reduce((sum, d) => sum + d.amount, 0);
  }, [adminDeductions, user]);

  // Employee View - Only see their own deductions
  if (user?.role === 'employee') {
    const employeeFullName = `${user.first_name} ${user.last_name}`;
    const employeeSalary = salaries.find(s => s.employeeName === employeeFullName);
    
    if (!employeeSalary) {
      return (
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Salary Information</h1>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <p className="text-yellow-800">Your salary record has not been configured yet. Please contact HR.</p>
          </div>
        </div>
      );
    }

    const finalSalary = employeeSalary.baseSalary - totalFoodDeductions - employeeAppliedDeductions + employeeSalary.bonus;

    return (
      <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Your Salary & Deductions</h1>
          <p className="text-gray-600 mt-2">View your salary details and food order deductions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Salary Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Salary Information</h2>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600 font-medium">Name</p>
                <p className="text-lg font-bold text-gray-900">{employeeSalary.employeeName}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600 font-medium">Position</p>
                <p className="text-gray-900">{employeeSalary.position}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600 font-medium">Department</p>
                <p className="text-gray-900">{employeeSalary.department}</p>
              </div>
              <div className="border-b pb-3 bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600 font-medium">Base Salary</p>
                <p className="text-2xl font-bold text-blue-600">${employeeSalary.baseSalary.toLocaleString()}</p>
              </div>
              <div className="border-b pb-3 bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600 font-medium">Bonus</p>
                <p className="text-2xl font-bold text-green-600">+ ${employeeSalary.bonus.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Food Deductions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🍽️ Cafeteria Deductions</h2>
            
            {employeeFoodDeductions.length > 0 ? (
              <div className="space-y-3">
                {employeeFoodDeductions.map((deduction) => (
                  <div key={deduction.id} className="border rounded-lg p-3 bg-orange-50 border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{deduction.itemName}</p>
                        <p className="text-sm text-gray-600">Qty: {deduction.quantity} × ₹{deduction.pricePerItem.toFixed(2)}</p>
                        <p className="text-xs text-gray-700 mt-1 bg-white px-2 py-1 rounded">📝 Why: Cafeteria order charged</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold block ${
                          deduction.status === 'picked-up' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deduction.status === 'picked-up' ? '✓ Deducted' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm text-gray-600">{deduction.orderDate}</p>
                      <p className="font-bold text-orange-600">- ${deduction.totalPrice}</p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-700">Total Food Deductions:</p>
                    <p className="text-xl font-bold text-red-600">- ${totalFoodDeductions}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No food orders yet. Visit the cafeteria to place an order!</p>
              </div>
            )}
          </div>
        </div>

        {/* Final Salary Calculation */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-white">📊 Final Salary Calculation</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 border-2 border-white border-opacity-40">
              <p className="text-sm font-semibold text-blue-100">Base Salary</p>
              <p className="text-3xl font-bold text-green-300">${employeeSalary.baseSalary.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 border-2 border-white border-opacity-40">
              <p className="text-sm font-semibold text-blue-100">Food Deductions</p>
              <p className="text-3xl font-bold text-red-300">- ${totalFoodDeductions}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 border-2 border-white border-opacity-40">
              <p className="text-sm font-semibold text-blue-100">Admin Deductions</p>
              <p className="text-3xl font-bold text-red-300">- ${employeeAppliedDeductions.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 border-2 border-white border-opacity-40">
              <p className="text-sm font-semibold text-blue-100">Bonus</p>
              <p className="text-3xl font-bold text-yellow-300">+ ${employeeSalary.bonus.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t-2 border-white border-opacity-40 flex justify-between items-center">
            <p className="text-xl font-bold text-white">TOTAL MONTHLY SALARY:</p>
            <p className="text-5xl font-bold text-yellow-100">${finalSalary.toLocaleString()}</p>
          </div>
        </div>

        {/* Admin Deductions Details */}
        {employeeAppliedDeductions > 0 && (
          <div className="mt-8 bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
            <h3 className="text-xl font-bold text-orange-800 mb-4">⚠️ Admin Deductions Applied</h3>
            <div className="space-y-3">
              {adminDeductions
                .filter(d => d.employee_name === `${user.first_name} ${user.last_name}` && d.status === 'applied')
                .map((deduction) => (
                  <div key={deduction.id} className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Amount: PKR {deduction.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Applied by: {deduction.created_by_name}</p>
                      </div>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">Applied</span>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-2 rounded"><strong>Reason:</strong> {deduction.reason}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin View - Manage all salaries
  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is for administrators only</p>
        </div>
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-800 mb-2">🔒 Admin Access Required</h2>
          <p className="text-red-700">Only administrators can access the salary and payroll management page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Salary & Payroll Management</h1>
        <p className="text-gray-600 mt-2">Manage employee salaries, bonuses, and payroll information</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Payroll</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${totalPayroll.toLocaleString()}</p>
          <p className="text-blue-600 text-xs font-medium mt-2">All employees</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{salaries.length}</p>
          <p className="text-green-600 text-xs font-medium mt-2">Total count</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Avg Salary</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${avgSalary.toLocaleString()}</p>
          <p className="text-purple-600 text-xs font-medium mt-2">Per employee</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Total Bonuses</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${salaries.reduce((sum, s) => sum + s.bonus, 0).toLocaleString()}</p>
          <p className="text-orange-600 text-xs font-medium mt-2">This period</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Food Deductions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${foodDeductions.filter(d => d.status === 'picked-up').reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()}</p>
          <p className="text-red-600 text-xs font-medium mt-2">Cafeteria orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Salary List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Salary Records</h2>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingId(null);
                setFormData({ employeeName: '', position: '', department: '', salaryType: 'monthly', baseSalary: '', hourlyRate: '', workingHoursPerMonth: '160', bonus: '' });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
            >
              {showAddForm ? '✕ Cancel' : '+ Add Salary'}
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Salary Record' : 'Add New Salary Record'}</h3>
              
              {/* Salary Type Selection */}
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-3">💼 Salary Type</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salaryType"
                      value="monthly"
                      checked={formData.salaryType === 'monthly'}
                      onChange={(e) => setFormData({ ...formData, salaryType: 'monthly' as 'monthly' | 'hourly' })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">Monthly Salary</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salaryType"
                      value="hourly"
                      checked={formData.salaryType === 'hourly'}
                      onChange={(e) => setFormData({ ...formData, salaryType: 'hourly' as 'monthly' | 'hourly' })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">Hourly Rate</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bonus ($)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="5000"
                  />
                </div>

                {/* Conditional fields based on salary type */}
                {formData.salaryType === 'monthly' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Base Salary ($)</label>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="85000"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Month</label>
                      <input
                        type="number"
                        value={formData.workingHoursPerMonth}
                        onChange={(e) => setFormData({ ...formData, workingHoursPerMonth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="160"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Calculated salary preview for hourly */}
              {formData.salaryType === 'hourly' && formData.hourlyRate && formData.workingHoursPerMonth && (
                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-gray-700">
                    💰 <span className="font-medium">Calculated Monthly Salary:</span> ${(parseInt(formData.hourlyRate) * parseInt(formData.workingHoursPerMonth)).toLocaleString()} per month
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddSalary}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Record'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ 
                      employeeName: '', 
                      position: '', 
                      department: '', 
                      salaryType: 'monthly',
                      baseSalary: '', 
                      hourlyRate: '',
                      workingHoursPerMonth: '160',
                      bonus: '' 
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSalaryFilter('all')}
              className={`px-4 py-2 rounded transition ${salaryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
            >
              All ({salaries.length})
            </button>
            <button
              onClick={() => setSalaryFilter('monthly')}
              className={`px-4 py-2 rounded transition ${salaryFilter === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
            >
              Monthly ({salaries.filter(s => s.salaryType === 'monthly').length})
            </button>
            <button
              onClick={() => setSalaryFilter('hourly')}
              className={`px-4 py-2 rounded transition ${salaryFilter === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
            >
              Hourly ({salaries.filter(s => s.salaryType === 'hourly').length})
            </button>
          </div>

          {/* Salary Records List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Salary/Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bonus</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.map((salary) => (
                  <tr key={salary.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900 font-medium">{salary.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600">{salary.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${salary.salaryType === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {salary.salaryType === 'monthly' ? '📅 Monthly' : '⏰ Hourly'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {salary.salaryType === 'monthly' 
                        ? `$${salary.baseSalary.toLocaleString()}/mo`
                        : `$${salary.hourlyRate}/hr (${salary.workingHoursPerMonth}h/mo)`
                      }
                    </td>
                    <td className="px-6 py-4 text-green-600 font-medium">${salary.bonus.toLocaleString()}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleViewSalary(salary.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditSalary(salary.id)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSalary(salary.id, salary.employeeName)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Details Panel */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Salary Details</h2>
          {selectedSalary ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase">Employee Name</p>
                <p className="text-lg font-bold text-gray-900">{selectedSalary.employeeName}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 font-medium uppercase">Position</p>
                <p className="text-gray-900">{selectedSalary.position}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 font-medium uppercase">Department</p>
                <p className="text-gray-900">{selectedSalary.department}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 font-medium uppercase">Salary Type</p>
                <p className="text-gray-900 font-medium">
                  {selectedSalary.salaryType === 'monthly' ? '📅 Monthly' : '⏰ Hourly'}
                </p>
              </div>
              {selectedSalary.salaryType === 'monthly' ? (
                <>
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600 font-medium uppercase">Monthly Base Salary</p>
                    <p className="text-2xl font-bold text-blue-600">${selectedSalary.baseSalary.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600 font-medium uppercase">Hourly Rate</p>
                    <p className="text-2xl font-bold text-purple-600">${selectedSalary.hourlyRate}/hour</p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600 font-medium uppercase">Working Hours/Month</p>
                    <p className="text-gray-900 font-medium">{selectedSalary.workingHoursPerMonth} hours</p>
                  </div>
                  <div className="border-t pt-3 bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600 font-medium uppercase">Calculated Monthly</p>
                    <p className="text-2xl font-bold text-green-600">${(selectedSalary.hourlyRate! * selectedSalary.workingHoursPerMonth!).toLocaleString()}</p>
                  </div>
                </>
              )}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 font-medium uppercase">Bonus</p>
                <p className="text-xl font-bold text-green-600">+ ${selectedSalary.bonus.toLocaleString()}</p>
              </div>
              <div className="border-t pt-3 bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 font-medium uppercase">Total Monthly (with bonus)</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(selectedSalary.baseSalary + selectedSalary.bonus).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a salary record to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Food Deductions Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🍽️ Food Order Deductions</h2>
        <p className="text-gray-600 mb-4">Manage food order deductions from employee salaries</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {foodDeductions.map((deduction) => (
                <tr key={deduction.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-900 font-medium">{deduction.employeeName}</td>
                  <td className="px-6 py-4 text-gray-600">{deduction.itemName}</td>
                  <td className="px-6 py-4 text-gray-600">{deduction.quantity}</td>
                  <td className="px-6 py-4 text-gray-600">${deduction.pricePerItem}</td>
                  <td className="px-6 py-4 text-red-600 font-bold">- ${deduction.totalPrice}</td>
                  <td className="px-6 py-4 text-gray-600">{deduction.orderDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      deduction.status === 'picked-up' 
                        ? 'bg-green-100 text-green-800'
                        : deduction.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deduction.status === 'picked-up' ? '✓ Picked Up' : deduction.status === 'cancelled' ? '✕ Cancelled' : '⏳ ' + deduction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deductions Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-600 font-medium">Total Deductions (Picked Up)</p>
            <p className="text-2xl font-bold text-red-600">${foodDeductions.filter(d => d.status === 'picked-up').reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-gray-600 font-medium">Total Deductions (Pending)</p>
            <p className="text-2xl font-bold text-yellow-600">${foodDeductions.filter(d => d.status !== 'picked-up' && d.status !== 'cancelled').reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{foodDeductions.length}</p>
          </div>
        </div>
      </div>

      {/* Payroll Summary with Deductions */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-white">💼 Payroll Summary (With Deductions)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm text-blue-100">Total Base Salaries</p>
            <p className="text-2xl font-bold text-green-300">${salaries.reduce((sum, s) => sum + s.baseSalary, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm text-blue-100">Total Food Deductions</p>
            <p className="text-2xl font-bold text-red-300">- ${foodDeductions.filter(d => d.status === 'picked-up').reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm text-blue-100">Total Bonuses</p>
            <p className="text-2xl font-bold text-yellow-300">+ ${salaries.reduce((sum, s) => sum + s.bonus, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm text-blue-100">Net Payroll</p>
            <p className="text-2xl font-bold text-purple-300">${(salaries.reduce((sum, s) => sum + s.baseSalary + s.bonus, 0) - foodDeductions.filter(d => d.status === 'picked-up').reduce((sum, d) => sum + d.totalPrice, 0)).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
