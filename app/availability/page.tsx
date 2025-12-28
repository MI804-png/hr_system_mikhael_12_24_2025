'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface AvailabilityRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  requestType: 'leave' | 'unavailable' | 'available';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdDate: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export default function Availability() {
  const { user } = useAuth();

  const employees = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
    { id: 4, name: 'Sarah Davis' },
    { id: 5, name: 'Tom Wilson' },
  ];

  const [availabilityRequests, setAvailabilityRequests] = useState<AvailabilityRequest[]>([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      requestType: 'leave',
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      reason: 'Annual leave - Family vacation',
      status: 'approved',
      createdDate: '2025-12-20',
      approvedBy: 'Admin',
      approvalDate: '2025-12-21',
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Jane Smith',
      requestType: 'unavailable',
      startDate: '2025-12-28',
      endDate: '2025-12-28',
      reason: 'Medical appointment',
      status: 'pending',
      createdDate: '2025-12-26',
    },
  ]);

  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>(user?.id.toString() || 'all');
  const [chartView, setChartView] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const [formData, setFormData] = useState({
    employeeId: user?.id?.toString() || '',
    requestType: 'leave' as 'leave' | 'unavailable' | 'available',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('availabilityRequests');
    if (saved) {
      try {
        setAvailabilityRequests(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load availability requests:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('availabilityRequests', JSON.stringify(availabilityRequests));
  }, [availabilityRequests]);

  const isAdmin = user?.role === 'admin';
  const isEmployee = !isAdmin;

  let filteredRequests = availabilityRequests;

  if (isEmployee) {
    filteredRequests = filteredRequests.filter(r => r.employeeId === user?.id);
  } else {
    if (filterEmployee !== 'all') {
      filteredRequests = filteredRequests.filter(r => r.employeeId === parseInt(filterEmployee));
    }
  }

  if (filterStatus !== 'all') {
    filteredRequests = filteredRequests.filter(r => r.status === filterStatus);
  }

  if (filterType !== 'all') {
    filteredRequests = filteredRequests.filter(r => r.requestType === filterType);
  }

  const handleSubmitRequest = () => {
    if (!formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      alert('❌ Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('❌ Start date must be before end date');
      return;
    }

    const employee = employees.find(e => e.id === parseInt(formData.employeeId));
    if (!employee) {
      alert('❌ Employee not found');
      return;
    }

    const newRequest: AvailabilityRequest = {
      id: Math.max(...availabilityRequests.map(r => r.id), 0) + 1,
      employeeId: parseInt(formData.employeeId),
      employeeName: employee.name,
      requestType: formData.requestType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: isAdmin ? 'approved' : 'pending',
      createdDate: new Date().toISOString().split('T')[0],
    };

    setAvailabilityRequests([...availabilityRequests, newRequest]);
    setShowForm(false);
    setFormData({
      employeeId: user?.id?.toString() || '',
      requestType: 'leave',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
    alert('✓ Request submitted successfully');
  };

  const handleApproveRequest = (requestId: number) => {
    setAvailabilityRequests(
      availabilityRequests.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              approvedBy: user ? `${user.first_name} ${user.last_name}` : 'Admin',
              approvalDate: new Date().toISOString().split('T')[0],
              notes: approvalNotes,
            }
          : r
      )
    );
    setApprovalNotes('');
    alert('✓ Request approved');
  };

  const handleRejectRequest = (requestId: number) => {
    setAvailabilityRequests(
      availabilityRequests.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              approvedBy: user ? `${user.first_name} ${user.last_name}` : 'Admin',
              approvalDate: new Date().toISOString().split('T')[0],
              notes: approvalNotes,
            }
          : r
      )
    );
    setApprovalNotes('');
    alert('✓ Request rejected');
  };

  const handleDeleteRequest = (requestId: number) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setAvailabilityRequests(availabilityRequests.filter(r => r.id !== requestId));
      alert('✓ Request deleted');
    }
  };

  const selectedRequest = availabilityRequests.find(r => r.id === selectedRequestId);

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'leave':
        return 'bg-red-100 text-red-800';
      case 'unavailable':
        return 'bg-yellow-100 text-yellow-800';
      case 'available':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-100 p-8">
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-block">← Back to Dashboard</Link>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isEmployee ? '📅 My Availability' : '👥 Employee Availability Requests'}
        </h1>
        <p className="text-gray-600 mb-8">
          {isEmployee ? 'Request time off or mark your availability' : 'Manage employee availability and leave requests'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEmployee ? 'Submit Request' : 'New Request'}
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="text-2xl text-blue-600 hover:text-blue-700"
                >
                  {showForm ? '✕' : '+'}
                </button>
              </div>

              {showForm && (
                <div className="space-y-4">
                  {isAdmin && (
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
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                    <select
                      value={formData.requestType}
                      onChange={(e) => setFormData({ ...formData, requestType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="leave" className="text-gray-900">Leave / Time Off</option>
                      <option value="unavailable" className="text-gray-900">Temporarily Unavailable</option>
                      <option value="available" className="text-gray-900">Available for Extra Work</option>
                    </select>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason / Notes</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      rows={3}
                      placeholder="Explain the reason for this request..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Submit Request
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Requests List and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            {isAdmin && (
              <div className="bg-white rounded-lg shadow-lg p-4 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="all" className="text-gray-900">All</option>
                    <option value="pending" className="text-gray-900">Pending</option>
                    <option value="approved" className="text-gray-900">Approved</option>
                    <option value="rejected" className="text-gray-900">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="all" className="text-gray-900">All</option>
                    <option value="leave" className="text-gray-900">Leave</option>
                    <option value="unavailable" className="text-gray-900">Unavailable</option>
                    <option value="available" className="text-gray-900">Available</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="all" className="text-gray-900">All</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id} className="text-gray-900">
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Analytics Charts */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">📊 Availability Analytics</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('day')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'day'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setChartView('week')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setChartView('month')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setChartView('year')}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      chartView === 'year'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Year
                  </button>
                </div>
              </div>

              <AnalyticsChart 
                requests={filteredRequests} 
                employees={employees}
                view={chartView}
              />
            </div>

            {/* Requests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    selectedRequestId === request.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 hover:shadow-lg'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{request.employeeName}</h3>
                  </div>
                  <p className={`text-sm ${selectedRequestId === request.id ? 'text-blue-100' : 'text-gray-600'}`}>
                    {request.startDate} to {request.endDate}
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getRequestTypeColor(request.requestType)}`}>
                      {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        selectedRequestId === request.id ? 'bg-blue-400 text-blue-900' : getStatusColor(request.status)
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
                <p className="text-lg">No requests found</p>
                <p className="text-sm mt-2">
                  {isEmployee ? 'Submit your first availability request above' : 'No pending requests'}
                </p>
              </div>
            )}

            {/* Selected Request Details */}
            {selectedRequest && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.employeeName}</h2>
                    <p className={`text-sm mt-1 font-semibold ${getRequestTypeColor(selectedRequest.requestType)} px-3 py-1 rounded w-fit`}>
                      {selectedRequest.requestType.charAt(0).toUpperCase() + selectedRequest.requestType.slice(1)}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 border-t pt-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequest.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequest.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequest.createdDate}</p>
                  </div>
                  {selectedRequest.approvalDate && (
                    <div>
                      <p className="text-sm text-gray-600">Decision Date</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedRequest.approvalDate}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Reason</p>
                  <p className="text-gray-900">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.notes && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-1">Admin Notes</p>
                    <p className="text-gray-900">{selectedRequest.notes}</p>
                  </div>
                )}

                {isAdmin && selectedRequest.status === 'pending' && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Admin Actions</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Approval Notes (Optional)</label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        rows={2}
                        placeholder="Add notes for the employee..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )}

                {isEmployee && (
                  <div className="border-t pt-4">
                    <button
                      onClick={() => {
                        handleDeleteRequest(selectedRequest.id);
                        setSelectedRequestId(null);
                      }}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Delete Request
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsChartProps {
  requests: AvailabilityRequest[];
  employees: Array<{ id: number; name: string }>;
  view: 'day' | 'week' | 'month' | 'year';
}

function AnalyticsChart({ requests, employees, view }: AnalyticsChartProps) {
  const getChartData = () => {
    const today = new Date();

    if (view === 'day') {
      return getDayData(today);
    } else if (view === 'week') {
      return getWeekData(today);
    } else if (view === 'month') {
      return getMonthData(today);
    } else {
      return getYearData(today);
    }
  };

  const getDayData = (date: Date) => {
    const dayString = date.toISOString().split('T')[0];
    const dayRequests = requests.filter(
      r => r.startDate <= dayString && r.endDate >= dayString
    );

    const typeCount = {
      leave: dayRequests.filter(r => r.requestType === 'leave').length,
      unavailable: dayRequests.filter(r => r.requestType === 'unavailable').length,
      available: dayRequests.filter(r => r.requestType === 'available').length,
    };

    return {
      labels: ['Leave', 'Unavailable', 'Available'],
      data: [typeCount.leave, typeCount.unavailable, typeCount.available],
      title: `${date.toDateString()}`,
      colors: ['#ef4444', '#eab308', '#22c55e'],
    };
  };

  const getWeekData = (date: Date) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [0, 0, 0, 0, 0, 0, 0];

    requests.forEach(r => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        data[index]++;
      }
    });

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());

    return {
      labels,
      data,
      title: `Week of ${weekStart.toLocaleDateString()}`,
      colors: Array(7).fill('#3b82f6'),
    };
  };

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const data = Array(daysInMonth).fill(0);

    requests.forEach(r => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          data[d.getDate() - 1]++;
        }
      }
    });

    return {
      labels,
      data,
      title: `${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      colors: Array(daysInMonth).fill('#06b6d4'),
    };
  };

  const getYearData = (date: Date) => {
    const year = date.getFullYear();
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    requests.forEach(r => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year) {
          data[d.getMonth()]++;
        }
      }
    });

    return {
      labels,
      data,
      title: `Year ${year}`,
      colors: Array(12).fill('#8b5cf6'),
    };
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.data, 1);
  const barWidth = 100 / chartData.labels.length - 2;

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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600">Total Leaves</p>
          <p className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.requestType === 'leave').length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-600">Unavailable</p>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.requestType === 'unavailable').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Extra Available</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.requestType === 'available').length}
          </p>
        </div>
      </div>
    </div>
  );
}
