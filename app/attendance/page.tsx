'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  signInTime: string;
  signOutTime: string;
  hoursWorked: number;
  status: 'present' | 'late' | 'absent' | 'leave';
  approved?: boolean;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  email: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    { id: 1, employeeId: 1, employeeName: 'John Doe', date: '2025-12-24', signInTime: '09:00', signOutTime: '17:30', hoursWorked: 8.5, status: 'present', approved: true },
    { id: 2, employeeId: 2, employeeName: 'Jane Smith', date: '2025-12-24', signInTime: '09:15', signOutTime: '17:30', hoursWorked: 8.25, status: 'late', approved: true },
    { id: 3, employeeId: 3, employeeName: 'Mike Johnson', date: '2025-12-24', signInTime: '', signOutTime: '', hoursWorked: 0, status: 'absent' },
    { id: 4, employeeId: 4, employeeName: 'Sarah Davis', date: '2025-12-24', signInTime: '09:00', signOutTime: '18:30', hoursWorked: 9.5, status: 'present', approved: false },
    { id: 5, employeeId: 5, employeeName: 'Tom Wilson', date: '2025-12-24', signInTime: '09:00', signOutTime: '17:00', hoursWorked: 8, status: 'present', approved: false },
  ]);

  // Employee database
  const [employees] = useState<Employee[]>([
    { id: 1, name: 'John Doe', position: 'Senior Developer', email: 'john@company.com' },
    { id: 2, name: 'Jane Smith', position: 'Project Manager', email: 'jane@company.com' },
    { id: 3, name: 'Mike Johnson', position: 'HR Manager', email: 'mike@company.com' },
    { id: 4, name: 'Sarah Davis', position: 'Full Stack Developer', email: 'sarah@company.com' },
    { id: 5, name: 'Tom Wilson', position: 'UI/UX Designer', email: 'tom@company.com' },
  ]);

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [signInTime, setSignInTime] = useState(new Date().toTimeString().slice(0, 5));
  const [signOutTime, setSignOutTime] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentEmployeeRecord, setCurrentEmployeeRecord] = useState<AttendanceRecord | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Get unique employees for selection
  const uniqueEmployees = useMemo(() => {
    const employees = attendanceRecords.map(r => ({
      id: r.employeeId,
      name: r.employeeName
    }));
    return Array.from(new Map(employees.map(e => [e.id, e])).values());
  }, [attendanceRecords]);

  // Filter records by selected date
  const todayRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // Check if current user has already signed in today
  const userTodayRecord = useMemo(() => {
    return todayRecords.find(r => r.employeeId === user?.id);
  }, [todayRecords, user?.id]);

  const stats = {
    present: todayRecords.filter(a => a.status === 'present').length,
    late: todayRecords.filter(a => a.status === 'late').length,
    absent: todayRecords.filter(a => a.status === 'absent').length,
    approved: todayRecords.filter(a => a.approved).length,
  };

  // Employee sign in
  const handleEmployeeSignIn = () => {
    if (!signInTime) {
      alert('❌ Please enter sign-in time');
      return;
    }
    
    if (!user) {
      alert('❌ User not logged in');
      return;
    }

    // Check if already signed in today
    if (userTodayRecord && userTodayRecord.signInTime) {
      alert('❌ You have already signed in today at ' + userTodayRecord.signInTime);
      return;
    }
    
    // Create attendance record for logged-in user
    const employeeName = `${user.first_name} ${user.last_name}`;
    const isLate = signInTime > '09:00';
    
    // Add new attendance record
    const newRecord: AttendanceRecord = {
      id: Math.max(...attendanceRecords.map(r => r.id), 0) + 1,
      employeeId: user.id,
      employeeName: employeeName,
      date: selectedDate,
      signInTime: signInTime,
      signOutTime: '',
      hoursWorked: 0,
      status: isLate ? 'late' : 'present',
      approved: false,
    };
    
    setAttendanceRecords([...attendanceRecords, newRecord]);
    setIsSignedIn(true);
    setSelectedEmployee(user.id);
    setCurrentEmployeeRecord(newRecord);
    alert(`✓ Welcome ${employeeName}! Signed in at ${signInTime}\n${isLate ? '⚠️ You are marked as LATE' : '✓ On time'}`);
    setShowSignInForm(false);
  };

  const handleEmployeeSignOut = () => {
    if (!userTodayRecord || !userTodayRecord.signInTime) {
      alert('❌ You must sign in first');
      return;
    }

    // Check if already signed out
    if (userTodayRecord.signOutTime) {
      alert('❌ You have already signed out today at ' + userTodayRecord.signOutTime);
      return;
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    setSignOutTime(currentTime);
    
    // Calculate hours worked
    const signIn = new Date(`2025-12-24T${userTodayRecord.signInTime}`);
    const signOut = new Date(`2025-12-24T${currentTime}`);
    const hoursWorked = (signOut.getTime() - signIn.getTime()) / (1000 * 60 * 60);
    
    // Update attendance record for logged-in user
    setAttendanceRecords(attendanceRecords.map(r => 
      r.id === userTodayRecord.id 
        ? { ...r, signOutTime: currentTime, hoursWorked: parseFloat(hoursWorked.toFixed(2)) }
        : r
    ));
    
    setIsSignedIn(false);
    setSelectedEmployee(null);
    setCurrentEmployeeRecord(null);
    const employeeName = `${user?.first_name} ${user?.last_name}`;
    alert(`✓ ${employeeName} signed out at ${currentTime}\nHours worked: ${hoursWorked.toFixed(2)}`);
  };

  const handleApproveAttendance = (id: number) => {
    setAttendanceRecords(attendanceRecords.map(r => 
      r.id === id ? { ...r, approved: !r.approved } : r
    ));
  };

  const handleMarkAttendance = (id: number, status: 'present' | 'late' | 'absent' | 'leave') => {
    setAttendanceRecords(attendanceRecords.map(r => 
      r.id === id ? { ...r, status } : r
    ));
    alert(`✓ ${attendanceRecords.find(r => r.id === id)?.employeeName} marked as ${status}`);
  };

  // Get absent employees for selected date
  const absentEmployees = useMemo(() => {
    return todayRecords
      .filter(r => r.status === 'absent' || !r.signInTime)
      .map(r => {
        const empData = employees.find(e => e.id === r.employeeId);
        return {
          name: r.employeeName,
          position: empData?.position || 'N/A',
          email: empData?.email || 'N/A',
        };
      });
  }, [todayRecords, employees]);

  // Send email notification to admin about absent employees
  const handleSendAbsenceNotification = async () => {
    if (absentEmployees.length === 0) {
      alert('✓ No absent employees to report');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/email/send-absence-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: user?.email || 'admin@company.com',
          absentEmployees: absentEmployees,
          date: selectedDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const result = await response.json();
      alert(`✓ Email sent successfully!\n\nNotified admin about ${absentEmployees.length} absent employee(s):\n${absentEmployees.map(e => e.name).join(', ')}`);
    } catch (error) {
      console.error('Email error:', error);
      alert(`❌ Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Please configure EMAIL_USER and EMAIL_PASSWORD environment variables.`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">📍 Attendance Management</h1>
        <p className="text-gray-600 mt-2">Sign in/out and manage employee attendance</p>
      </div>

      {/* Access Control - Only Employees */}
      {user?.role === 'admin' && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">⚠️ Admin Access Restricted</h2>
          <p className="text-yellow-700">This page is for employee attendance sign-in only.</p>
          <p className="text-yellow-700">Admins cannot sign in as employees.</p>
        </div>
      )}

      {/* Employee Sign In Section */}
      {user?.role === 'employee' && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">👤 Employee Sign In/Out</h2>

          {/* Email Verification Required */}
          {user?.role === 'employee' && !user?.emailVerified && (
            <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4 mb-4 text-red-900">
              <p className="font-semibold mb-2">🔒 Email Verification Required</p>
              <p className="text-sm mb-3">
                Your email address must be verified before you can sign in. A verification link has been sent to <strong>{user?.email}</strong>
              </p>
              <div className="flex gap-2">
                <a
                  href="/verify-email"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                >
                  ✓ Verify Email Now
                </a>
                <button
                  onClick={() => {
                    alert('A new verification email has been sent to ' + user?.email);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
                >
                  📧 Resend Link
                </button>
              </div>
              <p style={{ display: 'none' }}>Skip verification</p>
              <button
                onClick={() => alert('Email verification is required. Please check your email.')}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Need help?
              </button>
            </div>
          )}
          
          {/* Already Completed Today */}
          {userTodayRecord && userTodayRecord.signInTime && userTodayRecord.signOutTime && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-green-800">
              <p className="font-semibold">✓ Attendance completed today</p>
              <p className="text-sm">Signed in: {userTodayRecord.signInTime}</p>
              <p className="text-sm">Signed out: {userTodayRecord.signOutTime}</p>
              <p className="text-sm">Hours worked: {userTodayRecord.hoursWorked}</p>
            </div>
          )}
          
          {/* Already Signed In, Waiting to Sign Out */}
          {userTodayRecord && userTodayRecord.signInTime && !userTodayRecord.signOutTime && (
            <>
              <p className="text-lg font-semibold mb-3">✓ Signed in at: <span className="text-yellow-300">{userTodayRecord.signInTime}</span></p>
              <button
                onClick={handleEmployeeSignOut}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-bold text-lg"
              >
                🔒 Sign Out Now
              </button>
            </>
          )}
          
          {/* Not Yet Signed In Today */}
          {!userTodayRecord && (
            <>
              <button
                onClick={() => setShowSignInForm(!showSignInForm)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-bold text-lg"
              >
                🔓 Sign In Now
              </button>
            </>
          )}

          {showSignInForm && (
            <div className="mt-6 bg-white text-gray-900 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">👤 Your Name</label>
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-medium">
                  {user?.first_name} {user?.last_name}
                </div>
                <p className="text-xs text-gray-500 mt-2">Signed in as: {user?.email}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">⏰ Sign In Time</label>
                <input
                  type="time"
                  value={signInTime}
                  onChange={(e) => setSignInTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleEmployeeSignIn}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                ✓ Confirm Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
          <p className="text-xs text-gray-500 mt-1">on {selectedDate}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Late</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.late}</p>
          <p className="text-xs text-gray-500 mt-1">after 09:00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
          <p className="text-xs text-gray-500 mt-1">no sign-in</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.approved}</p>
          <p className="text-xs text-gray-500 mt-1">verified</p>
        </div>
      </div>

      {/* Admin View - Attendance Records */}
      {user?.role === 'admin' && (
        <>
          <div className="mb-6 flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {absentEmployees.length > 0 && (
              <div>
                <button
                  onClick={handleSendAbsenceNotification}
                  disabled={isSendingEmail}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? '📧 Sending...' : '📧 Send Absence Notification'}
                  <span className="bg-red-800 text-white text-xs px-2 py-1 rounded-full font-bold">{absentEmployees.length}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Sign In</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Sign Out</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Hours</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Approved</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.employeeName}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{record.signInTime || '-'}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{record.signOutTime || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{record.hoursWorked}h</td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={record.status}
                          onChange={(e) => handleMarkAttendance(record.id, e.target.value as any)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleApproveAttendance(record.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            record.approved
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {record.approved ? '✓ Approved' : 'Approve'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
