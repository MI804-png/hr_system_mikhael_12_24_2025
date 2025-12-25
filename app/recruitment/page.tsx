'use client';

import { useState, useEffect, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface JobPosting {
  id: number;
  title: string;
  description: string;
  salary_range_min?: number;
  salary_range_max?: number;
  status: 'draft' | 'open' | 'closed' | 'on_hold';
  posted_date: string;
  applications: number;
}

interface Candidate {
  id: number;
  job_posting: number;
  job_posting_title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume: string; // File URL from backend
  cover_letter: string;
  source: string;
  status: 'new' | 'screening' | 'interview_1' | 'interview_2' | 'interview_3' | 'offered' | 'hired' | 'rejected' | 'withdrawn' | 'waiting_list';
  rating: number;
  applied_date: string;
  assigned_to_name: string;
  notes: string;
  cvContent?: string; // Extracted CV text content
}

// Departments available in the system
const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Management',
  'Design',
  'Quality Assurance',
  'Customer Support',
];

interface Interview {
  id: number;
  candidate: number;
  interview_type: 'phone' | 'technical' | 'behavioral' | 'final';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  scheduled_date: string;
  duration_minutes: number;
  interviewer: number;
  interviewer_name: string;
  location: string;
  feedback: string;
  rating: number;
  interview_notes_file?: string; // Document file URL
  created_at: string;
}

interface Applicant {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  cvContent: string;
  cvFile?: string;
  appliedDate: string;
  status: string;
  cvUrl?: string;
}

export default function Recruitment() {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Candidate | null>(null);
  const [selectedInterviewCandidate, setSelectedInterviewCandidate] = useState<Candidate | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [interviewers] = useState([
    { id: 1, name: 'John Smith', role: 'HR Manager' },
    { id: 2, name: 'Sarah Johnson', role: 'Engineering Lead' },
    { id: 3, name: 'Mike Chen', role: 'Technical Lead' },
    { id: 4, name: 'Emily Davis', role: 'Senior Recruiter' },
  ]);
  const [interviewForm, setInterviewForm] = useState({
    interview_type: 'phone' as const,
    interviewer_id: interviewers[0]?.id || 1,
    scheduled_date: new Date().toISOString().split('T')[0],
    location: 'Virtual',
    feedback: '',
    rating: 0,
    duration_minutes: 60,
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    salary_range_min: '',
    salary_range_max: '',
    position_type: 'full_time',
    requirements: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch job postings
        const jobsResponse = await fetch('http://localhost:8080/api/recruitment/job-postings/', {
          headers,
          credentials: 'include',
        });
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData.results || jobsData);
        }

        // Fetch candidates with resume files
        const candidatesResponse = await fetch('http://localhost:8080/api/recruitment/candidates/', {
          headers,
          credentials: 'include',
        });
        if (candidatesResponse.ok) {
          const candidatesData = await candidatesResponse.json();
          // Filter candidates with resume files (PDF or DOCX)
          const filtered = (candidatesData.results || candidatesData).filter(
            (c: Candidate) => c.resume && (c.resume.includes('.pdf') || c.resume.includes('.docx'))
          );
          setCandidates(filtered);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter candidates by job posting
  const getApplicantsByJob = (jobId: number) => {
    return candidates.filter((app) => app.job_posting === jobId);
  };

  // Filter by status
  const filteredCandidates = useMemo(() => {
    if (statusFilter === 'all') {
      return selectedJob ? getApplicantsByJob(selectedJob) : candidates;
    }
    return (selectedJob ? getApplicantsByJob(selectedJob) : candidates).filter(
      (c) => c.status === statusFilter
    );
  }, [selectedJob, candidates, statusFilter]);

  const handleViewCV = async (candidate: Candidate) => {
    setSelectedApplicant(candidate);
    
    // Extract CV content if not already extracted
    if (!candidate.resume.includes('.pdf') && !candidate.resume.includes('.docx')) {
      setShowCVModal(true);
      return;
    }

    try {
      const cvUrl = `http://localhost:8080${candidate.resume}`;
      
      if (candidate.resume.includes('.pdf')) {
        const response = await fetch(cvUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let extractedText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n';
        }
        
        setSelectedApplicant({ ...candidate, cvContent: extractedText });
      } else if (candidate.resume.includes('.docx')) {
        const response = await fetch(cvUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setSelectedApplicant({ ...candidate, cvContent: result.value });
      }
    } catch (error) {
      console.error('Error extracting CV content:', error);
    }
    
    setShowCVModal(true);
  };

  const handleDownloadCV = (candidate: Candidate) => {
    const fileName = `${candidate.first_name}_${candidate.last_name}_CV${candidate.resume.substring(
      candidate.resume.lastIndexOf('.')
    )}`;
    const element = document.createElement('a');
    element.href = `http://localhost:8080${candidate.resume}`;
    element.download = fileName;
    element.setAttribute('target', '_blank');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleUpdateCandidateStatus = async (candidateId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:8080/api/recruitment/candidates/${candidateId}/update_status/`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setCandidates(candidates.map((c) => (c.id === candidateId ? updated : c)));
        if (selectedApplicant?.id === candidateId) {
          setSelectedApplicant(updated);
        }
        alert(`✓ Candidate status updated to: ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      alert('Failed to update status');
    }
  };

  // Quick action: Accept candidate (move to offered status)
  const handleAcceptCandidate = (candidateId: number, candidateName: string) => {
    if (confirm(`Accept ${candidateName} as a candidate?`)) {
      handleUpdateCandidateStatus(candidateId, 'offered');
    }
  };

  // Quick action: Add to waiting list
  const handleAddToWaitingList = (candidateId: number, candidateName: string) => {
    if (confirm(`Add ${candidateName} to waiting list?`)) {
      handleUpdateCandidateStatus(candidateId, 'waiting_list');
    }
  };

  // Quick action: Reject candidate
  const handleRejectCandidate = (candidateId: number, candidateName: string) => {
    if (confirm(`Reject ${candidateName}? This action cannot be undone.`)) {
      handleUpdateCandidateStatus(candidateId, 'rejected');
    }
  };

  // Interview Management Functions
  const handleAddInterview = async (candidateId: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const interviewData = {
        candidate: candidateId,
        interview_type: interviewForm.interview_type,
        interviewer: interviewForm.interviewer_id,
        scheduled_date: interviewForm.scheduled_date,
        location: interviewForm.location,
        feedback: interviewForm.feedback,
        rating: interviewForm.rating,
        duration_minutes: interviewForm.duration_minutes,
        status: 'scheduled',
      };

      const response = await fetch('http://localhost:8080/api/recruitment/interviews/', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(interviewData),
      });

      if (response.ok) {
        const newInterview = await response.json();
        setInterviews([...interviews, newInterview]);
        
        // Update candidate status to interview_1, interview_2, or interview_3
        const interviewCount = interviews.filter((i) => i.candidate === candidateId && i.status === 'completed').length + 1;
        let newStatus = 'interview_1';
        if (interviewCount === 2) newStatus = 'interview_2';
        if (interviewCount === 3) newStatus = 'interview_3';
        
        await handleUpdateCandidateStatus(candidateId, newStatus);
        
        setShowInterviewModal(false);
        setInterviewForm({
          interview_type: 'phone',
          interviewer_id: interviewers[0]?.id || 1,
          scheduled_date: new Date().toISOString().split('T')[0],
          location: 'Virtual',
          feedback: '',
          rating: 0,
          duration_minutes: 60,
        });
        alert('✓ Interview scheduled successfully');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview');
    }
  };

  const handleCompleteInterview = async (interviewId: number, candidateId: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:8080/api/recruitment/interviews/${interviewId}/complete_interview/`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            status: 'completed',
            feedback: interviewForm.feedback,
            rating: interviewForm.rating,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setInterviews(interviews.map((i) => (i.id === interviewId ? updated : i)));
        alert('✓ Interview marked as completed');
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Failed to complete interview');
    }
  };

  const handleUploadInterviewNotes = async (
    event: React.ChangeEvent<HTMLInputElement>,
    interviewId: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('interview_notes_file', file);

      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:8080/api/recruitment/interviews/${interviewId}/`,
        {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: formDataToSend,
        }
      );

      if (response.ok) {
        alert(`✓ Interview notes uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading interview notes:', error);
      alert('Failed to upload interview notes');
    }
  };

  const getCandidateInterviews = (candidateId: number) => {
    return interviews.filter((i) => i.candidate === candidateId).sort((a, b) => 
      new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    );
  };

  const handleViewJob = (jobId: number) => {
    setSelectedJob(jobId);
    setEditingId(null);
  };

  const handleAddNewJob = () => {
    setShowAddForm(!showAddForm);
    setEditingId(null);
    setSelectedJob(null);
    if (!showAddForm) {
      setFormData({
        title: '',
        description: '',
        department: '',
        salary_range_min: '',
        salary_range_max: '',
        position_type: 'full_time',
        requirements: '',
      });
    }
  };

  const handleEditJob = async (id: number) => {
    const job = jobs.find((j) => j.id === id);
    if (job) {
      setFormData({
        title: job.title,
        description: job.description,
        department: job.description.split('|')[0]?.trim() || '',
        salary_range_min: String(job.salary_range_min || ''),
        salary_range_max: String(job.salary_range_max || ''),
        position_type: 'full_time',
        requirements: job.description,
      });
      setEditingId(id);
      setShowAddForm(false);
      setSelectedJob(null);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8080/api/recruitment/job-postings/${id}/`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        setJobs(jobs.filter((j) => j.id !== id));
        alert('✓ Job posting deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job posting');
    }
  };

  const handleSaveJob = async () => {
    if (!formData.title || !formData.description || !formData.department) {
      alert('❌ Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        position_type: formData.position_type,
        requirements: formData.requirements,
        status: 'open',
      };

      let url = 'http://localhost:8080/api/recruitment/job-postings/';
      let method = 'POST';

      if (editingId) {
        url = `http://localhost:8080/api/recruitment/job-postings/${editingId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          setJobs(jobs.map((j) => (j.id === editingId ? data : j)));
          alert('✓ Job posting updated successfully');
          setEditingId(null);
        } else {
          setJobs([...jobs, data]);
          alert('✓ Job posting created successfully');
        }
        setShowAddForm(false);
        setFormData({
          title: '',
          description: '',
          department: '',
          salary_range_min: '',
          salary_range_max: '',
          position_type: 'full_time',
          requirements: '',
        });
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to save job posting');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      department: '',
      salary_range_min: '',
      salary_range_max: '',
      position_type: 'full_time',
      requirements: '',
    });
  };

  const selectedJobData = selectedJob ? jobs.find((j) => j.id === selectedJob) : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Recruitment</h1>
        <p className="text-gray-600 mt-2">Manage job openings and applications</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading recruitment data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Status Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="screening">Screening</option>
                <option value="interview_1">First Interview</option>
                <option value="interview_2">Second Interview</option>
                <option value="interview_3">Final Interview</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="waiting_list">Waiting List</option>
              </select>
            </div>

            {/* Add/Edit Job Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingId ? '✏️ Edit Job Posting' : '➕ Create New Job Opening'}
                </h3>
                <button
                  onClick={handleCancelForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Senior Developer, Product Manager, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Job description, responsibilities, and key requirements..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
                    <input
                      type="number"
                      value={formData.salary_range_min}
                      onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                      placeholder="e.g., 50000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary</label>
                    <input
                      type="number"
                      value={formData.salary_range_max}
                      onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                      placeholder="e.g., 80000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position Type</label>
                    <select
                      value={formData.position_type}
                      onChange={(e) => setFormData({ ...formData, position_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Required skills, experience, qualifications..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveJob}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    {editingId ? '💾 Save Changes' : '✓ Create Posting'}
                  </button>
                  <button
                    onClick={handleCancelForm}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Form Button */}
            <div className="mb-4">
              <button
                onClick={handleAddNewJob}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  showAddForm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showAddForm ? '✕ Cancel' : '+ New Job Opening'}
              </button>
            </div>

            {/* Job Postings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
              {jobs.length === 0 ? (
                <p className="text-gray-600">No job postings yet</p>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 cursor-pointer" onClick={() => handleViewJob(job.id)}>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.description}</p>
                        {job.salary_range_min && job.salary_range_max && (
                          <p className="text-blue-600 font-semibold mt-2">
                            ${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          job.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'closed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleViewJob(job.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium"
                      >
                        👁️ View Applications
                      </button>
                      <button
                        onClick={() => handleEditJob(job.id)}
                        className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>

            {/* Applicants List */}
            {selectedJob && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Applicants ({filteredCandidates.length})
                </h3>
                <div className="space-y-3">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-gray-500">No applicants with CV files for this position.</p>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {candidate.first_name} {candidate.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {candidate.email} • {candidate.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Applied: {new Date(candidate.applied_date).toLocaleDateString()}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              candidate.status === 'hired'
                                ? 'bg-green-100 text-green-800'
                                : candidate.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : candidate.status === 'offered'
                                ? 'bg-purple-100 text-purple-800'
                                : candidate.status === 'waiting_list'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {candidate.status === 'waiting_list' ? '⏳ Waiting List' : candidate.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* View and Download buttons */}
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => handleViewCV(candidate)}
                            className="px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition font-medium"
                          >
                            👁️ View CV
                          </button>
                          <button
                            onClick={() => handleDownloadCV(candidate)}
                            className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-medium"
                          >
                            📥 Download
                          </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 border-t pt-3">
                          <button
                            onClick={() => {
                              setSelectedInterviewCandidate(candidate);
                              setShowInterviewModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition font-medium"
                            title="Schedule interview"
                          >
                            📅 Interview
                          </button>
                          <button
                            onClick={() => handleAcceptCandidate(candidate.id, `${candidate.first_name} ${candidate.last_name}`)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-medium"
                            title="Move to Offered status"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleAddToWaitingList(candidate.id, `${candidate.first_name} ${candidate.last_name}`)}
                            className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition font-medium"
                            title="Add to Waiting List"
                          >
                            ⏳ Waiting List
                          </button>
                          <button
                            onClick={() => handleRejectCandidate(candidate.id, `${candidate.first_name} ${candidate.last_name}`)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition font-medium"
                            title="Reject candidate"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
            {selectedJobData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-semibold text-gray-900">{selectedJobData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applicants with CVs</p>
                  <p className="font-semibold text-gray-900">{getApplicantsByJob(selectedJob!).length}</p>
                </div>
                {selectedJobData.salary_range_min && selectedJobData.salary_range_max && (
                  <div>
                    <p className="text-sm text-gray-600">Salary Range</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedJobData.salary_range_min.toLocaleString()} - ${selectedJobData.salary_range_max.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mt-1">
                    {selectedJobData.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition font-medium"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a job posting to view details</p>
            )}
          </div>
        </div>

        {showCVModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedApplicant?.first_name} {selectedApplicant?.last_name}
                </h2>
                <p className="text-gray-600 mt-1">{selectedApplicant?.job_posting_title}</p>
              </div>
              <button
                onClick={() => {
                  setShowCVModal(false);
                  setSelectedApplicant(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{selectedApplicant?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedApplicant?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applied</p>
                  <p className="font-semibold text-gray-900">
                    {selectedApplicant?.applied_date ? new Date(selectedApplicant.applied_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">{selectedApplicant?.status?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {/* CV Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3 font-medium">CV Content</p>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-800 border border-gray-200 max-h-96 overflow-y-auto">
                  {selectedApplicant?.cvContent || 'Loading CV content...'}
                </div>
              </div>

              {/* Status Update */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-3 font-medium">Update Status</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'new',
                    'screening',
                    'interview_1',
                    'interview_2',
                    'interview_3',
                    'offered',
                    'hired',
                    'rejected',
                    'withdrawn',
                    'waiting_list',
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => selectedApplicant && handleUpdateCandidateStatus(selectedApplicant.id, status)}
                      className={`px-3 py-2 rounded font-medium text-sm transition ${
                        selectedApplicant?.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {status === 'waiting_list' ? '⏳ List' : status.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => selectedApplicant && handleDownloadCV(selectedApplicant)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                >
                  📥 Download CV
                </button>
                <button
                  onClick={() => {
                    setShowCVModal(false);
                    setSelectedApplicant(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
        {showInterviewModal && selectedInterviewCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
                <p className="text-gray-600 mt-1">
                  {selectedInterviewCandidate?.first_name} {selectedInterviewCandidate?.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  setSelectedInterviewCandidate(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Previous Interviews */}
              {selectedInterviewCandidate && getCandidateInterviews(selectedInterviewCandidate.id).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Interview History</h3>
                  <div className="space-y-3">
                    {selectedInterviewCandidate && getCandidateInterviews(selectedInterviewCandidate.id).map((interview) => (
                      <div key={interview.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {interview.interview_type.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">{interview.interviewer_name}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              interview.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : interview.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          📅 {new Date(interview.scheduled_date).toLocaleString()}
                        </p>
                        {interview.feedback && (
                          <p className="text-sm text-gray-800 italic">"{interview.feedback}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm font-medium text-gray-700">Rating:</span>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={i < interview.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {interview.interview_notes_file && (
                          <div className="mt-3">
                            <a
                              href={`http://localhost:8080${interview.interview_notes_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              📄 View Interview Notes
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <hr className="my-4" />
                </div>
              )}

              {/* Schedule New Interview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Interview</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type *</label>
                      <select
                        value={interviewForm.interview_type}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, interview_type: e.target.value as any })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="phone">Phone Screening</option>
                        <option value="technical">Technical Interview</option>
                        <option value="behavioral">Behavioral Interview</option>
                        <option value="final">Final Round</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer *</label>
                      <select
                        value={interviewForm.interviewer_id}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, interviewer_id: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {interviewers.map((interviewer) => (
                          <option key={interviewer.id} value={interviewer.id}>
                            {interviewer.name} - {interviewer.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date *</label>
                      <input
                        type="date"
                        value={interviewForm.scheduled_date}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, scheduled_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={interviewForm.duration_minutes}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, duration_minutes: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={interviewForm.location}
                      onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                      placeholder="Virtual, Office Address, or Video Call Link"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                    <textarea
                      value={interviewForm.feedback}
                      onChange={(e) => setInterviewForm({ ...interviewForm, feedback: e.target.value })}
                      placeholder="Interview feedback, notes, impressions..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5 stars)</label>
                    <div className="flex gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setInterviewForm({ ...interviewForm, rating: i })}
                          className={`text-2xl transition ${
                            i <= interviewForm.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Interview Notes (Optional)</label>
                    <label className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      📄 Click to upload or drag and drop
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          // File is uploaded when interview is created
                          if (e.target.files?.[0]) {
                            const fileName = e.target.files[0].name;
                            alert(`File selected: ${fileName}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap border-t pt-4">
                <button
                  onClick={() => selectedInterviewCandidate && handleAddInterview(selectedInterviewCandidate.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  📅 Schedule Interview
                </button>
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    setSelectedInterviewCandidate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      )}
    </div>
  );
}
