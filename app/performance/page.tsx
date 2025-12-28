'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  baseSalary: number;
  hireDate: string;
  expertise: string[];
  cv: string;
  projects: string[];
}

interface AttendanceRecord {
  employeeId: number;
  employeeName: string;
  presentDays: number;
  absentDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}

interface PerformanceReview {
  employeeId: number;
  employeeName: string;
  rating: number;
  feedback: string;
  reviewDate: string;
  promotionRecommended: boolean;
  promotionReason?: string;
}

export default function Performance() {
  const { user } = useAuth();

  const [employees] = useState<Employee[]>([
    {
      id: 1,
      name: 'John Doe',
      position: 'Senior Developer',
      department: 'Engineering',
      email: 'john@company.com',
      baseSalary: 85000,
      hireDate: '2020-03-15',
      expertise: ['React', 'TypeScript', 'Node.js', 'AWS', 'System Design'],
      cv: 'Senior Full Stack Developer with 8+ years experience. Led multiple high-impact projects. Expert in cloud architecture and team leadership.',
      projects: ['HR System Redesign', 'API Optimization', 'Cloud Migration'],
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Project Manager',
      department: 'Management',
      email: 'jane@company.com',
      baseSalary: 75000,
      hireDate: '2021-06-10',
      expertise: ['Agile/Scrum', 'Team Management', 'Stakeholder Communication', 'Budget Planning', 'Risk Management'],
      cv: 'Certified PMP with 6+ years managing large-scale projects. Excellent track record delivering on-time and within budget.',
      projects: ['Q4 Initiative Launch', 'Team Restructuring', 'Process Optimization'],
    },
    {
      id: 3,
      name: 'Mike Johnson',
      position: 'HR Manager',
      department: 'Human Resources',
      email: 'mike@company.com',
      baseSalary: 65000,
      hireDate: '2019-09-20',
      expertise: ['Recruitment', 'Employee Relations', 'Compliance', 'Training & Development', 'Compensation'],
      cv: 'HR Professional with 5+ years experience. Specialized in talent acquisition and employee development programs.',
      projects: ['Recruitment Drive 2025', 'Employee Handbook Update', 'Training Program Design'],
    },
    {
      id: 4,
      name: 'Sarah Davis',
      position: 'Full Stack Developer',
      department: 'Engineering',
      email: 'sarah@company.com',
      baseSalary: 78000,
      hireDate: '2021-02-08',
      expertise: ['React', 'Python', 'PostgreSQL', 'Docker', 'CI/CD'],
      cv: 'Full Stack Developer with 4+ years experience. Strong problem solver with passion for clean code and best practices.',
      projects: ['Mobile App Development', 'Database Optimization', 'DevOps Pipeline'],
    },
    {
      id: 5,
      name: 'Tom Wilson',
      position: 'UI/UX Designer',
      department: 'Design',
      email: 'tom@company.com',
      baseSalary: 70000,
      hireDate: '2020-11-05',
      expertise: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
      cv: 'Creative Designer with 6+ years in digital design. Proficient in creating user-centered designs and design systems.',
      projects: ['Design System v2', 'Mobile UI Redesign', 'User Research Initiative'],
    },
  ]);

  const [attendanceData] = useState<AttendanceRecord[]>([
    { employeeId: 1, employeeName: 'John Doe', presentDays: 220, absentDays: 5, totalWorkingDays: 225, attendancePercentage: 97.8 },
    { employeeId: 2, employeeName: 'Jane Smith', presentDays: 215, absentDays: 10, totalWorkingDays: 225, attendancePercentage: 95.6 },
    { employeeId: 3, employeeName: 'Mike Johnson', presentDays: 210, absentDays: 15, totalWorkingDays: 225, attendancePercentage: 93.3 },
    { employeeId: 4, employeeName: 'Sarah Davis', presentDays: 222, absentDays: 3, totalWorkingDays: 225, attendancePercentage: 98.7 },
    { employeeId: 5, employeeName: 'Tom Wilson', presentDays: 218, absentDays: 7, totalWorkingDays: 225, attendancePercentage: 96.9 },
  ]);

  const [reviews, setReviews] = useState<PerformanceReview[]>([
    { employeeId: 1, employeeName: 'John Doe', rating: 4.8, feedback: 'Exceptional technical leadership and mentoring skills. Demonstrates innovation and takes ownership of projects.', reviewDate: '2025-12-15', promotionRecommended: true, promotionReason: 'Ready for Tech Lead role' },
    { employeeId: 2, employeeName: 'Jane Smith', rating: 4.7, feedback: 'Excellent project management and team coordination. Strong strategic thinking and problem-solving.', reviewDate: '2025-12-15', promotionRecommended: true, promotionReason: 'Ready for Director role' },
    { employeeId: 3, employeeName: 'Mike Johnson', rating: 4.3, feedback: 'Good HR management and compliance. Needs to improve strategic initiative planning.', reviewDate: '2025-12-15', promotionRecommended: false },
    { employeeId: 4, employeeName: 'Sarah Davis', rating: 4.6, feedback: 'Strong technical skills and teamwork. Good growth potential. Needs more project ownership.', reviewDate: '2025-12-15', promotionRecommended: false },
    { employeeId: 5, employeeName: 'Tom Wilson', rating: 4.5, feedback: 'Creative and collaborative designer. Contributes well to design system improvements.', reviewDate: '2025-12-15', promotionRecommended: false },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const [formData, setFormData] = useState({
    rating: 4,
    feedback: '',
    promotionRecommended: false,
    promotionReason: '',
  });

  const departments = ['all', ...new Set(employees.map(e => e.department))];

  // Calculate promotion score
  const calculatePromotionScore = (emp: Employee): number => {
    const attendance = attendanceData.find(a => a.employeeId === emp.id);
    const review = reviews.find(r => r.employeeId === emp.id);
    const yearsOfService = new Date().getFullYear() - new Date(emp.hireDate).getFullYear();
    
    let score = 0;
    if (attendance) score += attendance.attendancePercentage * 0.3;
    if (review) score += review.rating * 25 * 0.4;
    score += Math.min(yearsOfService * 5, 25) * 0.3;
    
    return Math.round(score);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      filterDepartment === 'all' || emp.department === filterDepartment
    );
  }, [filterDepartment]);

  const employeesWithScores = useMemo(() => {
    return filteredEmployees.map(emp => ({
      ...emp,
      promotionScore: calculatePromotionScore(emp),
      attendance: attendanceData.find(a => a.employeeId === emp.id),
      review: reviews.find(r => r.employeeId === emp.id),
    })).sort((a, b) => b.promotionScore - a.promotionScore);
  }, [filteredEmployees]);

  const handleSaveReview = () => {
    const selectedEmp = employees.find(e => e.id === selectedEmployee);
    if (!selectedEmp || !formData.feedback.trim()) {
      alert('❌ Please fill in all fields');
      return;
    }

    if (editingReviewId) {
      setReviews(reviews.map(r => 
        r.employeeId === editingReviewId
          ? {
              ...r,
              rating: formData.rating,
              feedback: formData.feedback,
              promotionRecommended: formData.promotionRecommended,
              promotionReason: formData.promotionReason,
              reviewDate: new Date().toISOString().split('T')[0],
            }
          : r
      ));
    } else {
      const existingReview = reviews.find(r => r.employeeId === selectedEmployee);
      if (existingReview) {
        setReviews(reviews.map(r => 
          r.employeeId === selectedEmployee
            ? {
                ...r,
                rating: formData.rating,
                feedback: formData.feedback,
                promotionRecommended: formData.promotionRecommended,
                promotionReason: formData.promotionReason,
                reviewDate: new Date().toISOString().split('T')[0],
              }
            : r
        ));
      } else {
        setReviews([...reviews, {
          employeeId: selectedEmployee!,
          employeeName: selectedEmp.name,
          rating: formData.rating,
          feedback: formData.feedback,
          promotionRecommended: formData.promotionRecommended,
          promotionReason: formData.promotionReason,
          reviewDate: new Date().toISOString().split('T')[0],
        }]);
      }
    }
    setShowReviewForm(false);
    setEditingReviewId(null);
    alert('✓ Review saved successfully');
  };

  const handleEditReview = (employeeId: number) => {
    const review = reviews.find(r => r.employeeId === employeeId);
    if (review) {
      setFormData({
        rating: review.rating,
        feedback: review.feedback,
        promotionRecommended: review.promotionRecommended,
        promotionReason: review.promotionReason || '',
      });
      setEditingReviewId(employeeId);
      setShowReviewForm(true);
    }
  };

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
  const selectedEmployeeMetrics = selectedEmployeeData ? {
    attendance: attendanceData.find(a => a.employeeId === selectedEmployeeData.id),
    review: reviews.find(r => r.employeeId === selectedEmployeeData.id),
    promotionScore: calculatePromotionScore(selectedEmployeeData),
  } : null;

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">Only admins can access performance reviews.</p>
        <Link href="/dashboard" className="text-blue-600 mt-4 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <Link href="/dashboard" className="text-blue-600 mb-6 inline-block">← Back to Dashboard</Link>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Performance Reviews</h1>
        <p className="text-gray-600 mb-8">Evaluate employee performance and make promotion decisions</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Employees</h2>
              
              <div className="mb-4">
                <select 
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept} className="text-gray-900">
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employeesWithScores.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedEmployee === emp.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{emp.name}</div>
                    <div className={`text-sm ${selectedEmployee === emp.id ? 'text-blue-100' : 'text-gray-600'}`}>
                      {emp.position}
                    </div>
                    <div className={`text-xs mt-1 font-semibold ${
                      emp.promotionScore >= 80 ? 'text-green-600' : 
                      emp.promotionScore >= 70 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      Score: {emp.promotionScore}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="lg:col-span-2">
            {selectedEmployeeData && selectedEmployeeMetrics ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEmployeeData.name}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployeeData.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployeeData.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployeeData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Base Salary</p>
                      <p className="text-lg font-semibold text-gray-900">₹{selectedEmployeeData.baseSalary.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* CV Summary */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">CV Summary</h3>
                    <p className="text-gray-700">{selectedEmployeeData.cv}</p>
                  </div>
                </div>

                {/* Expertise & Projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployeeData.expertise.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Key Projects</h3>
                    <ul className="space-y-2">
                      {selectedEmployeeData.projects.map((project, idx) => (
                        <li key={idx} className="flex items-center text-gray-700">
                          <span className="text-blue-500 mr-2">✓</span> {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Attendance */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Attendance</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {selectedEmployeeMetrics.attendance?.attendancePercentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedEmployeeMetrics.attendance?.presentDays} / {selectedEmployeeMetrics.attendance?.totalWorkingDays} days
                    </p>
                  </div>

                  {/* Performance Rating */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Performance Rating</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {selectedEmployeeMetrics.review?.rating.toFixed(1)} / 5.0
                    </div>
                    <p className="text-sm text-gray-600">Last reviewed: {selectedEmployeeMetrics.review?.reviewDate}</p>
                  </div>
                </div>

                {/* Promotion Score */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                  <h3 className="font-semibold mb-3">Promotion Score</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold">{selectedEmployeeMetrics.promotionScore}/100</div>
                    <div className="text-right">
                      {selectedEmployeeMetrics.promotionScore >= 80 && (
                        <div className="text-lg font-semibold">🟢 Ready for Promotion</div>
                      )}
                      {selectedEmployeeMetrics.promotionScore >= 70 && selectedEmployeeMetrics.promotionScore < 80 && (
                        <div className="text-lg font-semibold">🟡 Consider for Promotion</div>
                      )}
                      {selectedEmployeeMetrics.promotionScore < 70 && (
                        <div className="text-lg font-semibold">🔴 Not Yet Ready</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Feedback */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Review Feedback</h3>
                    <button
                      onClick={() => {
                        handleEditReview(selectedEmployee!);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Edit Review
                    </button>
                  </div>
                  <p className="text-gray-700 mb-4">{selectedEmployeeMetrics.review?.feedback}</p>
                  {selectedEmployeeMetrics.review?.promotionRecommended && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">✓ Promotion Recommended:</span> {selectedEmployeeMetrics.review.promotionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                Select an employee to view their details
              </div>
            )}
          </div>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && selectedEmployeeData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Review for {selectedEmployeeData.name}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    rows={4}
                    placeholder="Enter performance feedback..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.promotionRecommended}
                    onChange={(e) => setFormData({ ...formData, promotionRecommended: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Recommend for Promotion</label>
                </div>

                {formData.promotionRecommended && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Reason</label>
                    <input
                      type="text"
                      value={formData.promotionReason}
                      onChange={(e) => setFormData({ ...formData, promotionReason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="e.g., Ready for Tech Lead role"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveReview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Save Review
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
