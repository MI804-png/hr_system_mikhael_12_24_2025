'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { validateEmployeeForm, isValidEmail, getFieldError, hasFieldError, ValidationError } from '../../lib/validators';

// History interfaces
interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  checkIn?: string;
  checkOut?: string;
}

interface SalaryRecord {
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
}

interface FoodOrder {
  date: string;
  item: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'ready' | 'picked-up';
}

interface HistoryEvent {
  id: number;
  type: 'attendance' | 'salary' | 'order' | 'support' | 'note';
  date: string;
  title: string;
  description: string;
  details?: any;
  icon: string;
}

export default function Employees() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const searchParams = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<null | string>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [employees, setEmployees] = useState([
    { id: 1, code: 'EMP-0001', name: 'John Doe', position: 'Senior Developer', department: 'Engineering', email: 'john@company.com', joinDate: '2021-03-15', salaryType: 'monthly' as 'monthly' | 'hourly', emailVerified: true },
    { id: 2, code: 'EMP-0002', name: 'Jane Smith', position: 'Project Manager', department: 'Management', email: 'jane@company.com', joinDate: '2020-07-22', salaryType: 'hourly' as 'monthly' | 'hourly', emailVerified: true },
    { id: 3, code: 'EMP-0003', name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources', email: 'mike@company.com', joinDate: '2019-11-10', salaryType: 'monthly' as 'monthly' | 'hourly', emailVerified: false },
    { id: 4, code: 'EMP-0004', name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering', email: 'sarah@company.com', joinDate: '2022-01-10', salaryType: 'hourly' as 'monthly' | 'hourly', emailVerified: true },
    { id: 5, code: 'EMP-0005', name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design', email: 'tom@company.com', joinDate: '2021-05-18', salaryType: 'monthly' as 'monthly' | 'hourly', emailVerified: false },
  ]);

  // Employee history data
  const employeeHistory: Record<string, HistoryEvent[]> = {
    'John Doe': [
      { id: 1, type: 'attendance', date: '2025-12-24', title: 'Present', description: 'Worked full day', details: { checkIn: '09:00 AM', checkOut: '06:00 PM' }, icon: '✓' },
      { id: 2, type: 'order', date: '2025-12-25', title: 'Food Order', description: 'Ordered Biryani (2x)', details: { item: 'Biryani', quantity: 2, amount: 300 }, icon: '🍽️' },
      { id: 3, type: 'salary', date: '2025-12-20', title: 'Salary Processed', description: 'December salary - $85,000 (with deductions)', details: { baseSalary: 85000, deductions: 400, bonus: 5000 }, icon: '💰' },
      { id: 4, type: 'support', date: '2025-12-18', title: 'Support Ticket Resolved', description: 'Technical issue with email verification', details: { ticketId: 1, status: 'resolved' }, icon: '🆘' },
      { id: 5, type: 'note', date: '2025-12-15', title: 'Performance Review', description: 'Excellent performance in Q4', details: { rating: 'Excellent' }, icon: '⭐' },
    ],
    'Jane Smith': [
      { id: 1, type: 'attendance', date: '2025-12-24', title: 'Present', description: 'Worked full day', details: { checkIn: '09:15 AM', checkOut: '05:45 PM' }, icon: '✓' },
      { id: 2, type: 'order', date: '2025-12-25', title: 'Food Order', description: 'Ordered Paneer Tikka (1x) & Naan (2x)', details: { item: 'Paneer Tikka + Naan', quantity: 3, amount: 200 }, icon: '🍽️' },
      { id: 3, type: 'salary', date: '2025-12-20', title: 'Salary Processed', description: 'December salary - $80,000', details: { baseSalary: 80000, deductions: 200, bonus: 0 }, icon: '💰' },
      { id: 4, type: 'note', date: '2025-12-10', title: 'Project Milestone', description: 'Completed Project X ahead of schedule', details: { project: 'Project X' }, icon: '✅' },
    ],
    'Mike Johnson': [
      { id: 1, type: 'attendance', date: '2025-12-24', title: 'Present', description: 'Worked full day', details: { checkIn: '08:45 AM', checkOut: '05:30 PM' }, icon: '✓' },
      { id: 2, type: 'order', date: '2025-12-24', title: 'Food Order', description: 'Ordered Samosa (5x)', details: { item: 'Samosa', quantity: 5, amount: 150 }, icon: '🍽️' },
      { id: 3, type: 'salary', date: '2025-12-20', title: 'Salary Processed', description: 'December salary - $75,000', details: { baseSalary: 75000, deductions: 150, bonus: 4000 }, icon: '💰' },
      { id: 4, type: 'support', date: '2025-12-12', title: 'Support Ticket Created', description: 'Account setup assistance request', details: { ticketId: 2, status: 'open' }, icon: '🆘' },
    ],
    'Sarah Davis': [
      { id: 1, type: 'attendance', date: '2025-12-24', title: 'Late', description: 'Arrived 30 minutes late', details: { checkIn: '09:30 AM', checkOut: '06:00 PM' }, icon: '⏰' },
      { id: 2, type: 'salary', date: '2025-12-20', title: 'Salary Processed', description: 'December salary - $72,000', details: { baseSalary: 72000, deductions: 0, bonus: 0 }, icon: '💰' },
      { id: 3, type: 'note', date: '2025-12-05', title: 'Training Completed', description: 'React Advanced Patterns certification', details: { course: 'React Patterns' }, icon: '📚' },
    ],
    'Tom Wilson': [
      { id: 1, type: 'attendance', date: '2025-12-24', title: 'Present', description: 'Worked full day', details: { checkIn: '09:00 AM', checkOut: '06:00 PM' }, icon: '✓' },
      { id: 2, type: 'salary', date: '2025-12-20', title: 'Salary Processed', description: 'December salary - $65,000', details: { baseSalary: 65000, deductions: 0, bonus: 2000 }, icon: '💰' },
      { id: 3, type: 'note', date: '2025-11-20', title: 'Design Award', description: 'Won UI/UX Design Excellence Award', details: { award: 'Design Excellence' }, icon: '🏆' },
    ],
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    salaryType: 'monthly' as 'monthly' | 'hourly',
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterDepartment === 'all' || emp.department === filterDepartment;
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, searchQuery, filterDepartment]);

  const departments = ['all', ...new Set(employees.map(e => e.department))];

  const generateEmployeeCode = () => {
    const maxId = Math.max(...employees.map(e => e.id), 0);
    const newId = maxId + 1;
    return `EMP-${String(newId).padStart(4, '0')}`;
  };

  const handleViewEmployee = (name: string) => {
    setSelectedEmployee(name);
    setEditingId(null);
  };

  const handleEditEmployee = (id: number) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setFormData({
        name: emp.name,
        position: emp.position,
        department: emp.department,
        email: emp.email,
        salaryType: emp.salaryType,
      });
      setEditingId(id);
      setShowAddForm(false);
      setSelectedEmployee(null);
    }
  };

  const handleAddNewEmployee = () => {
    setShowAddForm(!showAddForm);
    setEditingId(null);
    setSelectedEmployee(null);
    if (!showAddForm) {
      setFormData({ name: '', position: '', department: '', email: '', salaryType: 'monthly' });
    }
  };

  const handleSaveEmployee = () => {
    const validationErrors = validateEmployeeForm(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      alert('❌ Please fix the errors in the form');
      return;
    }

    setErrors([]);

    if (editingId) {
      // Update existing employee
      const updatedEmployee = employees.find(emp => emp.id === editingId);
      setEmployees(
        employees.map(emp =>
          emp.id === editingId
            ? { ...emp, ...formData }
            : emp
        )
      );
      
      // Send notification to the employee
      if (updatedEmployee) {
        addNotification({
          title: '📋 Your Profile Updated',
          message: `Your employee profile has been updated by admin. Changes: ${Object.entries(formData)
            .filter(([key, value]) => updatedEmployee[key as keyof typeof updatedEmployee] !== value)
            .map(([key]) => key)
            .join(', ')}`,
          type: 'info',
          forUser: formData.email,
        });
      }
      
      setEditingId(null);
      alert('✓ Employee updated successfully and notified');
    } else {
      // Add new employee
      const maxId = Math.max(...employees.map(e => e.id), 0);
      const newId = maxId + 1;
      setEmployees([
        ...employees,
        {
          id: newId,
          code: `EMP-${String(newId).padStart(4, '0')}`,
          ...formData,
          joinDate: new Date().toISOString().split('T')[0],
          emailVerified: false,
        },
      ]);
      
      // Send notification to the new employee
      addNotification({
        title: '👋 Welcome to HR System',
        message: `You have been added to the system as ${formData.position}. Your employee code is EMP-${String(maxId + 1).padStart(4, '0')}`,
        type: 'success',
        forUser: formData.email,
      });
      
      setShowAddForm(false);
      alert('✓ Employee added successfully and notified');
    }
    setFormData({ name: '', position: '', department: '', email: '', salaryType: 'monthly' });
    setErrors([]);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', position: '', department: '', email: '', salaryType: 'monthly' });
    setErrors([]);
  };

  const handleDeleteEmployee = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setEmployees(employees.filter(emp => emp.id !== id));
      setSelectedEmployee(null);
      alert('✓ Employee deleted successfully');
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      if (jsonData.length === 0) {
        alert('❌ No data found in Excel file');
        return;
      }

      const importedEmployees = jsonData
        .map(row => ({
          name: row.name || row.Name || '',
          position: row.position || row.Position || '',
          department: row.department || row.Department || '',
          email: row.email || row.Email || '',
          salaryType: (row.salaryType || row.SalaryType || 'monthly').toLowerCase() === 'hourly' ? 'hourly' : 'monthly' as 'monthly' | 'hourly',
        }))
        .filter(emp => emp.name && emp.email && isValidEmail(emp.email));

      if (importedEmployees.length === 0) {
        alert('❌ No valid employees found in the file');
        return;
      }

      // Add valid employees
      const maxId = Math.max(...employees.map((e) => e.id), 0);
      const newEmployees = importedEmployees.map((emp, index) => {
        const newId = maxId + index + 1;
        return {
          id: newId,
          code: `EMP-${String(newId).padStart(4, '0')}`,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          email: emp.email,
          salaryType: emp.salaryType,
          emailVerified: false,
          joinDate: new Date().toISOString().split('T')[0],
        };
      });

      setEmployees([...employees, ...newEmployees]);
      alert(`✓ Successfully imported ${newEmployees.length} employee(s)`);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Failed to import Excel file. Please check the file format.');
    }
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredEmployees.map(emp => ({
        'Employee Code': emp.code,
        'Name': emp.name,
        'Position': emp.position,
        'Department': emp.department,
        'Email': emp.email,
        'Join Date': emp.joinDate,
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 14 },  // Employee Code
        { wch: 18 },  // Name
        { wch: 20 },  // Position
        { wch: 16 },  // Department
        { wch: 24 },  // Email
        { wch: 12 },  // Join Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Employees_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);
      alert(`✓ Successfully exported ${filteredEmployees.length} employee(s) to ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export Excel file');
    }
  };

  const selectedEmployeeData = employees.find(emp => emp.name === selectedEmployee);

  // Access control - Admins only
  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is for administrators only</p>
        </div>
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-800 mb-2">🔒 Admin Access Required</h2>
          <p className="text-red-700">Only administrators can access the employee management page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-600 mt-2">Manage your employee database</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Employee List</h2>
            <div className="flex gap-2">
              <button 
                onClick={handleExportExcel}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
                📊 Export Excel
              </button>
              <label className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium cursor-pointer">
                📥 Import Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
              <button 
                onClick={handleAddNewEmployee}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium">
                {showAddForm ? '✕ Cancel' : '+ Add Employee'}
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error) => (
                      <li key={error.field} className="text-sm text-red-700">{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name {hasFieldError(errors, 'name') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                      hasFieldError(errors, 'name')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {getFieldError(errors, 'name') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError(errors, 'name')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position {hasFieldError(errors, 'position') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                      hasFieldError(errors, 'position')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {getFieldError(errors, 'position') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError(errors, 'position')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department {hasFieldError(errors, 'department') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                      hasFieldError(errors, 'department')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {getFieldError(errors, 'department') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError(errors, 'department')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {hasFieldError(errors, 'email') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                      hasFieldError(errors, 'email')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {getFieldError(errors, 'email') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError(errors, 'email')}</p>
                  )}
                </div>
              </div>

              {/* Salary Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Salary Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.salaryType === 'monthly'}
                      onChange={() => setFormData({ ...formData, salaryType: 'monthly' })}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-gray-700">Monthly Salary</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.salaryType === 'hourly'}
                      onChange={() => setFormData({ ...formData, salaryType: 'hourly' })}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-gray-700">Hourly Rate</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEmployee}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  {editingId ? 'Save Changes' : 'Add Employee'}
                </button>
                <button
                  onClick={handleCancelForm}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="🔍 Search by name, position, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ✕ Clear search: "{searchQuery}"
                </button>
              )}
            </div>
            
            <div className="flex gap-3 items-center">
              <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || filterDepartment !== 'all') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Found <span className="font-semibold text-blue-600">{filteredEmployees.length}</span> result(s)
                  {searchQuery && <span> for "{searchQuery}"</span>}
                  {filterDepartment !== 'all' && <span> in {filterDepartment}</span>}
                </p>
              </div>
            )}
          </div>

          {/* Employee List */}
          <div className="space-y-4">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No employees found matching your search.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDepartment('all');
                  }}
                  className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500 mb-1">Code: {emp.code}</p>
                    <p className="text-sm text-gray-600">{emp.position} • {emp.department}</p>
                    <div className="flex gap-2 mt-2">
                      <p className="text-xs text-blue-600 font-medium">
                        💰 {emp.salaryType === 'hourly' ? 'Hourly Rate' : 'Monthly Salary'}
                      </p>
                      <p className={`text-xs font-medium px-2 py-0.5 rounded ${emp.emailVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.emailVerified ? '✓ Verified' : '⚠️ Unverified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewEmployee(emp.name)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditEmployee(emp.id)}
                      className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition font-medium text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedEmployee ? `📋 ${selectedEmployee}'s Profile & History` : 'Employee Details & History'}
          </h2>
          {selectedEmployee ? (
            <>
              {employees.find(emp => emp.name === selectedEmployee) && (
                <div className="space-y-6">
                  {/* Employee Info Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👤 Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Employee Code</p>
                        <p className="font-bold text-blue-600 text-lg">{employees.find(emp => emp.name === selectedEmployee)?.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Name</p>
                        <p className="font-bold text-gray-900">{employees.find(emp => emp.name === selectedEmployee)?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Position</p>
                        <p className="font-semibold text-gray-900">{employees.find(emp => emp.name === selectedEmployee)?.position}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Department</p>
                        <p className="font-semibold text-gray-900">{employees.find(emp => emp.name === selectedEmployee)?.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Email</p>
                        <p className="font-semibold text-gray-900">{employees.find(emp => emp.name === selectedEmployee)?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Join Date</p>
                        <p className="font-semibold text-gray-900">{employees.find(emp => emp.name === selectedEmployee)?.joinDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">💰 Salary Type</p>
                        <p className="font-semibold text-blue-600">{employees.find(emp => emp.name === selectedEmployee)?.salaryType === 'hourly' ? 'Hourly Rate' : 'Monthly Salary'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">📧 Email Status</p>
                        <p className={`font-semibold px-2 py-1 rounded inline-block ${employees.find(emp => emp.name === selectedEmployee)?.emailVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {employees.find(emp => emp.name === selectedEmployee)?.emailVerified ? '✓ Verified' : '⚠️ Unverified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* History Timeline */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Activity History</h3>
                    <div className="space-y-4 relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400"></div>
                      
                      {/* History events */}
                      {employeeHistory[selectedEmployee] && employeeHistory[selectedEmployee].length > 0 ? (
                        employeeHistory[selectedEmployee]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((event) => (
                            <div key={event.id} className="relative pl-20">
                              {/* Timeline dot */}
                              <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                                event.type === 'attendance' ? 'bg-green-100 text-green-600' :
                                event.type === 'salary' ? 'bg-blue-100 text-blue-600' :
                                event.type === 'order' ? 'bg-orange-100 text-orange-600' :
                                event.type === 'support' ? 'bg-red-100 text-red-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {event.icon}
                              </div>

                              {/* Event card */}
                              <div className={`p-4 rounded-lg border ${
                                event.type === 'attendance' ? 'bg-green-50 border-green-200' :
                                event.type === 'salary' ? 'bg-blue-50 border-blue-200' :
                                event.type === 'order' ? 'bg-orange-50 border-orange-200' :
                                event.type === 'support' ? 'bg-red-50 border-red-200' :
                                'bg-purple-50 border-purple-200'
                              }`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{event.title}</p>
                                    <p className="text-sm text-gray-600">{event.description}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">{event.date}</span>
                                </div>

                                {/* Event Details */}
                                {event.details && (
                                  <div className="mt-3 pt-3 border-t border-gray-300 border-opacity-30">
                                    {event.type === 'attendance' && event.details.checkIn && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <p className="text-gray-600">Check-In: <span className="font-semibold text-gray-900">{event.details.checkIn}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Check-Out: <span className="font-semibold text-gray-900">{event.details.checkOut}</span></p>
                                        </div>
                                      </div>
                                    )}

                                    {event.type === 'order' && (
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <p className="text-gray-600">Item: <span className="font-semibold text-gray-900">{event.details.item}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Qty: <span className="font-semibold text-gray-900">{event.details.quantity}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Amount: <span className="font-semibold text-orange-600">${event.details.amount}</span></p>
                                        </div>
                                      </div>
                                    )}

                                    {event.type === 'salary' && (
                                      <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <p className="text-gray-600">Base: <span className="font-semibold text-gray-900">${event.details.baseSalary}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Deductions: <span className="font-semibold text-red-600">-${event.details.deductions}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Bonus: <span className="font-semibold text-green-600">+${event.details.bonus}</span></p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Net: <span className="font-bold text-blue-600">${event.details.baseSalary - event.details.deductions + event.details.bonus}</span></p>
                                        </div>
                                      </div>
                                    )}

                                    {event.type === 'support' && event.details.ticketId && (
                                      <p className="text-xs text-gray-600">
                                        Ticket #{event.details.ticketId} - <span className={`font-semibold ${event.details.status === 'resolved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                          {event.details.status === 'resolved' ? '✓ Resolved' : '⏳ ' + event.details.status}
                                        </span>
                                      </p>
                                    )}

                                    {event.type === 'note' && event.details && (
                                      <p className="text-xs text-gray-700">
                                        {Object.entries(event.details).map(([key, value]) => (
                                          <span key={key} className="block"><span className="font-semibold capitalize">{key}:</span> {String(value)}</span>
                                        ))}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 italic">No history available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="w-full mt-8 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition font-medium"
              >
                Clear Selection
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-center py-12">Select an employee to view profile and activity history</p>
          )}
        </div>
      </div>
    </div>
  );
}
