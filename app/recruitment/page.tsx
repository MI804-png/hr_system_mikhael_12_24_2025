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
  status: 'new' | 'screening' | 'interview_1' | 'interview_2' | 'interview_3' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  rating: number;
  applied_date: string;
  assigned_to_name: string;
  notes: string;
  cvContent?: string; // Extracted CV text content
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
  const [showCVModal, setShowCVModal] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
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

  const handleViewJob = (jobId: number) => {
    setSelectedJob(jobId);
    setEditingId(null);
  };

  const handleAddNewJob = () => {
    setShowAddForm(!showAddForm);
    setEditingId(null);
    setSelectedJob(null);
    if (!showAddForm) {
      setFormData({ title: '', description: '', salary: '' });
    }
  };

  const handleEditJob = (id: number) => {
    // TODO: Implement edit job posting
  };

  const handleDeleteJob = (id: number, title: string) => {
    // TODO: Implement delete job posting
  };

  const handleSaveJob = () => {
    // TODO: Implement save job posting
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ title: '', description: '', salary: '' });
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
              </select>
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
                    onClick={() => handleViewJob(job.id)}
                    className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer ${
                      selectedJob === job.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.description}</p>
                        {job.salary_range_min && job.salary_range_max && (
                          <p className="text-blue-600 font-semibold mt-2">
                            ${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'closed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {candidate.first_name} {candidate.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {candidate.email} • {candidate.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Applied: {new Date(candidate.applied_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              candidate.status === 'hired'
                                ? 'bg-green-100 text-green-800'
                                : candidate.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : candidate.status === 'offered'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {candidate.status.replace(/_/g, ' ')}
                          </span>
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
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
      )}

      {/* CV Modal */}
      {showCVModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedApplicant.first_name} {selectedApplicant.last_name}
                </h2>
                <p className="text-gray-600 mt-1">{selectedApplicant.job_posting_title}</p>
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
                  <p className="font-semibold text-gray-900">{selectedApplicant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedApplicant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applied</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedApplicant.applied_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">{selectedApplicant.status.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {/* CV Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3 font-medium">CV Content</p>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-800 border border-gray-200 max-h-96 overflow-y-auto">
                  {selectedApplicant.cvContent || 'Loading CV content...'}
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
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateCandidateStatus(selectedApplicant.id, status)}
                      className={`px-3 py-2 rounded font-medium text-sm transition ${
                        selectedApplicant.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleDownloadCV(selectedApplicant)}
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
    </div>
  );
}
