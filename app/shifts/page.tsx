'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ShiftAssignment {
  id: number;
  employeeId: number;
  employeeName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'archived';
  assignedDate: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
}

const SHIFT_TEMPLATES = [
  { name: 'Morning Shift', startTime: '06:00', endTime: '14:00' },
  { name: 'Evening Shift', startTime: '14:00', endTime: '22:00' },
  { name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
  { name: 'Full Day', startTime: '09:00', endTime: '18:00' },
  { name: 'Custom', startTime: '', endTime: '' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Shifts() {
  const { user } = useAuth();

  const [employees] = useState<Employee[]>([
    { id: 1, name: 'John Doe', position: 'Senior Developer', department: 'Engineering' },
    { id: 2, name: 'Jane Smith', position: 'Project Manager', department: 'Management' },
    { id: 3, name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources' },
    { id: 4, name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering' },
    { id: 5, name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design' },
  ]);

  const [shifts, setShifts] = useState<ShiftAssignment[]>([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      shiftName: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      assignedDate: '2025-12-15',
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Jane Smith',
      shiftName: 'Full Day',
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'active',
      assignedDate: '2025-12-15',
    },
  ]);

  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  const [formData, setFormData] = useState({
    employeeId: '',
    shiftName: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  useEffect(() => {
    const saved = localStorage.getItem('shifts');
    if (saved) {
      try {
        setShifts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load shifts:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  const [chartView, setChartView] = useState<'day' | 'week'>('week');

  const filteredShifts = shifts.filter(
    shift =>
      (filterStatus === 'all' || shift.status === filterStatus) &&
      (filterEmployee === 'all' || shift.employeeId === parseInt(filterEmployee))
  );

  const handleAssignShift = () => {
    if (!formData.employeeId || !formData.startTime || !formData.endTime) {
      alert('❌ Please fill in all required fields');
      return;
    }

    const employee = employees.find(e => e.id === parseInt(formData.employeeId));
    if (!employee) {
      alert('❌ Employee not found');
      return;
    }

    const newShift: ShiftAssignment = {
      id: Math.max(...shifts.map(s => s.id), 0) + 1,
      employeeId: parseInt(formData.employeeId),
      employeeName: employee.name,
      shiftName: formData.shiftName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      daysOfWeek: formData.daysOfWeek,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: 'active',
      assignedDate: new Date().toISOString().split('T')[0],
    };

    setShifts([...shifts, newShift]);
    setShowForm(false);
    setFormData({
      employeeId: '',
      shiftName: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
    alert('✓ Shift assigned successfully');
  };

  const handleToggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleStatusChange = (shiftId: number, newStatus: 'active' | 'inactive' | 'archived') => {
    setShifts(shifts.map(s => (s.id === shiftId ? { ...s, status: newStatus } : s)));
    alert('✓ Shift status updated');
  };

  const handleDeleteShift = (shiftId: number) => {
    if (confirm('Are you sure you want to delete this shift assignment?')) {
      setShifts(shifts.filter(s => s.id !== shiftId));
      alert('✓ Shift deleted');
    }
  };

  const selectedShift = shifts.find(s => s.id === selectedShiftId);
  const shiftTemplate = SHIFT_TEMPLATES.find(t => t.name === formData.shiftName);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">Only admins can manage shifts.</p>
        <Link href="/dashboard" className="text-blue-600 mt-4 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-block">← Back to Dashboard</Link>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📅 Work Shift Management</h1>
        <p className="text-gray-600 mb-8">Assign and manage employee work shifts</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Assignment Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Assign Shift</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="text-2xl text-blue-600 hover:text-blue-700"
                >
                  {showForm ? '✕' : '+'}
                </button>
              </div>

              {showForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="text-gray-900">
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                    <select
                      value={formData.shiftName}
                      onChange={(e) => {
                        const template = SHIFT_TEMPLATES.find(t => t.name === e.target.value);
                        if (template) {
                          setFormData({
                            ...formData,
                            shiftName: e.target.value,
                            startTime: template.startTime,
                            endTime: template.endTime,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      {SHIFT_TEMPLATES.map(shift => (
                        <option key={shift.name} value={shift.name} className="text-gray-900">
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                    <div className="space-y-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.daysOfWeek.includes(day)}
                            onChange={() => handleToggleDay(day)}
                            className="mr-2 rounded"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAssignShift}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Assign Shift
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shifts List and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-lg p-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="all" className="text-gray-900">All</option>
                  <option value="active" className="text-gray-900">Active</option>
                  <option value="inactive" className="text-gray-900">Inactive</option>
                  <option value="archived" className="text-gray-900">Archived</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Employee</label>
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="all" className="text-gray-900">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="text-gray-900">
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shift Analytics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">📊 Shift Analytics</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('day')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'day'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setChartView('week')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    This Week
                  </button>
                </div>
              </div>

              <ShiftAnalyticsChart shifts={filteredShifts} view={chartView} />
            </div>

            {/* Shifts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShifts.map(shift => (
                <div
                  key={shift.id}
                  onClick={() => setSelectedShiftId(shift.id)}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    selectedShiftId === shift.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 hover:shadow-lg'
                  }`}
                >
                  <h3 className="font-semibold text-lg">{shift.employeeName}</h3>
                  <p className={`text-sm ${selectedShiftId === shift.id ? 'text-blue-100' : 'text-gray-600'}`}>
                    {shift.shiftName}
                  </p>
                  <p className={`text-sm font-medium mt-2 ${selectedShiftId === shift.id ? 'text-blue-100' : 'text-gray-700'}`}>
                    {shift.startTime} - {shift.endTime}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        shift.status === 'active'
                          ? 'bg-green-200 text-green-800'
                          : shift.status === 'inactive'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Shift Details */}
            {selectedShift && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedShift.employeeName}</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Shift Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedShift.shiftName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedShift.startTime} - {selectedShift.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedShift.daysOfWeek.length === 7
                        ? 'Everyday'
                        : selectedShift.daysOfWeek.length === 5
                        ? 'Weekdays'
                        : selectedShift.daysOfWeek.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedShift.startDate} to {selectedShift.endDate}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Actions</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedShift.status}
                      onChange={(e) => handleStatusChange(selectedShift.id, e.target.value as any)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="active" className="text-gray-900">Active</option>
                      <option value="inactive" className="text-gray-900">Inactive</option>
                      <option value="archived" className="text-gray-900">Archived</option>
                    </select>
                    <button
                      onClick={() => {
                        handleDeleteShift(selectedShift.id);
                        setSelectedShiftId(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShiftAnalyticsChartProps {
  shifts: ShiftAssignment[];
  view: 'day' | 'week';
}

function ShiftAnalyticsChart({ shifts, view }: ShiftAnalyticsChartProps) {
  const getDayData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(
      s => s.startDate <= today && s.endDate >= today && s.status === 'active'
    );

    const shiftTypeCounts = {
      morning: todayShifts.filter(s => s.shiftName === 'Morning Shift').length,
      evening: todayShifts.filter(s => s.shiftName === 'Evening Shift').length,
      night: todayShifts.filter(s => s.shiftName === 'Night Shift').length,
      fullday: todayShifts.filter(s => s.shiftName === 'Full Day').length,
      custom: todayShifts.filter(s => s.shiftName === 'Custom').length,
    };

    return {
      labels: ['Morning (6am)', 'Evening (2pm)', 'Night (10pm)', 'Full Day (9am)', 'Custom'],
      data: [shiftTypeCounts.morning, shiftTypeCounts.evening, shiftTypeCounts.night, shiftTypeCounts.fullday, shiftTypeCounts.custom],
      title: `Shifts Today - ${new Date(today).toDateString()}`,
      colors: ['#f97316', '#06b6d4', '#8b5cf6', '#ec4899', '#6366f1'],
    };
  };

  const getWeekData = () => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [0, 0, 0, 0, 0, 0, 0];

    shifts.forEach(shift => {
      if (shift.status === 'active') {
        shift.daysOfWeek.forEach(day => {
          const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
          if (dayIndex !== -1) {
            data[dayIndex]++;
          }
        });
      }
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    return {
      labels,
      data,
      title: `Weekly Shift Schedule - Week of ${weekStart.toLocaleDateString()}`,
      colors: Array(7).fill('#10b981'),
    };
  };

  const chartData = view === 'day' ? getDayData() : getWeekData();
  const maxValue = Math.max(...chartData.data, 1);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{chartData.title}</h3>

      {/* Bar Chart */}
      <div className="bg-gray-50 p-6 rounded-lg overflow-x-auto">
        <div className="flex items-end gap-3 h-80 min-w-full" style={{ justifyContent: 'space-around' }}>
          {chartData.labels.map((label, index) => {
            const value = chartData.data[index] || 0;
            const height = (value / maxValue) * 100;

            return (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full rounded-t transition hover:opacity-80"
                  style={{
                    backgroundColor: chartData.colors[index],
                    height: `${Math.max(height, 5)}%`,
                    minHeight: '20px',
                  }}
                  title={`${label}: ${value}`}
                />
                <span className="text-xs font-medium text-gray-700">{label}</span>
                <span className="text-xs font-semibold text-gray-900">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">Active Shifts</p>
          <p className="text-2xl font-bold text-orange-600">{shifts.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Assigned Today</p>
          <p className="text-2xl font-bold text-blue-600">
            {shifts.filter(
              s =>
                s.status === 'active' &&
                s.startDate <= new Date().toISOString().split('T')[0] &&
                s.endDate >= new Date().toISOString().split('T')[0]
            ).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Employees</p>
          <p className="text-2xl font-bold text-purple-600">{new Set(shifts.map(s => s.employeeId)).size}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Total Assignments</p>
          <p className="text-2xl font-bold text-green-600">{shifts.length}</p>
        </div>
      </div>
    </div>
  );
}
