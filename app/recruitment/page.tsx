'use client';

import { useState, useEffect, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

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

// Departments available in the system (matching dashboard)
const DEPARTMENTS = [
  'Engineering',
  'Management',
  'Human Resources',
  'Design',
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
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'cv-management' | 'interviews'>('jobs');
  const [employees, setEmployees] = useState<any[]>([]);
  const [showContinueInterviewModal, setShowContinueInterviewModal] = useState(false);
  const [selectedInterviewToContinue, setSelectedInterviewToContinue] = useState<any>(null);
  const [continueInterviewForm, setContinueInterviewForm] = useState({ rating: '', feedback: '' });
  const [cvFilter, setCVFilter] = useState<string>('all'); // all, approved, pending, rejected
  const [interviewFilter, setInterviewFilter] = useState<string>('all'); // all, scheduled, completed, cancelled
  const [interviewDepartmentFilter, setInterviewDepartmentFilter] = useState<string>('all');
  const [importedCVData, setImportedCVData] = useState<any[]>([]);
  const [selectedCVData, setSelectedCVData] = useState<any | null>(null);
  const [showCVApprovalModal, setShowCVApprovalModal] = useState(false);
  const [cvApprovalForm, setCVApprovalForm] = useState({
    cv_id: '',
    approved: false,
    notes: '',
  });
  const [scheduleInterviewForm, setScheduleInterviewForm] = useState({
    candidateId: '',
    interviewType: 'Initial Screening',
    scheduledDate: '',
    time: '',
    duration: '60',
    interviewerId: '',
    location: 'Virtual',
    grading: '',
  });
  const [interviewForm, setInterviewForm] = useState({
    interview_type: 'phone' as const,
    interviewer_id: '',
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

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
      } catch (error) {
        console.warn('PDF.js worker initialization:', error);
      }
    }
  }, []);

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
        try {
          const jobsResponse = await fetch('http://localhost:8080/api/recruitment/job-postings/', {
            headers,
            credentials: 'include',
          });
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            setJobs(jobsData.results || jobsData);
            // Save to localStorage for fallback
            localStorage.setItem('jobPostings', JSON.stringify(jobsData.results || jobsData));
          } else {
            throw new Error('Failed to fetch jobs');
          }
        } catch (jobError) {
          console.warn('Job postings API failed, checking localStorage:', jobError);
          // Try to load from localStorage first
          const savedJobs = localStorage.getItem('jobPostings');
          if (savedJobs) {
            try {
              setJobs(JSON.parse(savedJobs));
            } catch {
              // If localStorage is corrupted, use mock data
              const mockJobs: JobPosting[] = [
                { id: 1, title: 'Senior Developer', description: 'Looking for experienced full-stack developer', posted_date: '2025-12-15', status: 'open', applications: 12 },
                { id: 2, title: 'Project Manager', description: 'Lead cross-functional teams', posted_date: '2025-12-10', status: 'open', applications: 8 },
                { id: 3, title: 'UI/UX Designer', description: 'Create intuitive user experiences', posted_date: '2025-12-05', status: 'closed', applications: 15 },
              ];
              setJobs(mockJobs);
            }
          } else {
            // Use mock job postings
            const mockJobs: JobPosting[] = [
              { id: 1, title: 'Senior Developer', description: 'Looking for experienced full-stack developer', posted_date: '2025-12-15', status: 'open', applications: 12 },
              { id: 2, title: 'Project Manager', description: 'Lead cross-functional teams', posted_date: '2025-12-10', status: 'open', applications: 8 },
              { id: 3, title: 'UI/UX Designer', description: 'Create intuitive user experiences', posted_date: '2025-12-05', status: 'closed', applications: 15 },
            ];
            setJobs(mockJobs);
          }
        }

        // Fetch candidates with resume files
        try {
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
          } else {
            throw new Error('Failed to fetch candidates');
          }
        } catch (candidateError) {
          console.warn('Candidates API failed, using mock data:', candidateError);
          // Use mock candidates
          const mockCandidates: Candidate[] = [
            { id: 1, job_posting: 1, job_posting_title: 'Senior Developer', first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com', phone: '123-456-7890', resume: 'alice_resume.pdf', cover_letter: 'Interested in the role', source: 'LinkedIn', status: 'interview_1', rating: 4.5, applied_date: '2025-12-20', assigned_to_name: 'HR Admin', notes: 'Strong candidate' },
            { id: 2, job_posting: 2, job_posting_title: 'Project Manager', first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com', phone: '234-567-8901', resume: 'bob_resume.pdf', cover_letter: 'Great opportunity', source: 'Indeed', status: 'screening', rating: 4.0, applied_date: '2025-12-22', assigned_to_name: 'HR Admin', notes: 'Under review' },
            { id: 3, job_posting: 3, job_posting_title: 'UI/UX Designer', first_name: 'Carol', last_name: 'Davis', email: 'carol@example.com', phone: '345-678-9012', resume: 'carol_resume.docx', cover_letter: 'Excited to apply', source: 'Referral', status: 'interview_2', rating: 4.7, applied_date: '2025-12-18', assigned_to_name: 'HR Admin', notes: 'Excellent portfolio' },
          ];
          setCandidates(mockCandidates);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        // Load imported CVs from localStorage
        const savedCVs = localStorage.getItem('importedCVs');
        if (savedCVs) {
          try {
            const parsedCVs = JSON.parse(savedCVs);
            console.log('Loaded imported CVs from localStorage:', parsedCVs);
            setImportedCVData(parsedCVs);
          } catch (e) {
            console.warn('Failed to load imported CVs:', e);
          }
        } else {
          console.log('No imported CVs found in localStorage');
        }

        // Load interviews from localStorage
        const savedInterviews = localStorage.getItem('interviews');
        if (savedInterviews) {
          try {
            setInterviews(JSON.parse(savedInterviews));
          } catch (e) {
            console.warn('Failed to load interviews:', e);
          }
        }

        // Initialize real employees as interviewers
        const companyEmployees = [
          { id: 1, code: 'EMP-0001', name: 'John Doe', position: 'Senior Developer', department: 'Engineering', email: 'john@company.com' },
          { id: 2, code: 'EMP-0002', name: 'Jane Smith', position: 'Project Manager', department: 'Management', email: 'jane@company.com' },
          { id: 3, code: 'EMP-0003', name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources', email: 'mike@company.com' },
          { id: 4, code: 'EMP-0004', name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering', email: 'sarah@company.com' },
          { id: 5, code: 'EMP-0005', name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design', email: 'tom@company.com' }
        ];
        setEmployees(companyEmployees);

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
    if (!candidate.resume || (!candidate.resume.includes('.pdf') && !candidate.resume.includes('.docx'))) {
      setShowCVModal(true);
      return;
    }

    try {
      const cvUrl = `http://localhost:8080/${candidate.resume}`;
      
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
    if (!candidate.resume) {
      alert('Resume file not found');
      return;
    }
    const fileName = `${candidate.first_name}_${candidate.last_name}_CV${candidate.resume.substring(
      candidate.resume.lastIndexOf('.')
    )}`;
    const element = document.createElement('a');
    element.href = `http://localhost:8080/${candidate.resume}`;
    element.download = fileName;
    element.setAttribute('target', '_blank');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleUpdateCandidateStatus = async (candidateId: number, newStatus: Candidate['status']) => {
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
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      // Try localStorage fallback if API is not available
      if (selectedApplicant && selectedApplicant.id) {
        const updatedCandidate: Candidate = { ...selectedApplicant, status: newStatus };
        setCandidates(candidates.map((c) => (c.id === candidateId ? updatedCandidate : c)));
        setSelectedApplicant(updatedCandidate);
        alert(`✓ Candidate status updated to: ${newStatus} (saved locally)`);
      }
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
        let newStatus: Candidate['status'] = 'interview_1';
        if (interviewCount === 2) newStatus = 'interview_2';
        if (interviewCount === 3) newStatus = 'interview_3';
        
        await handleUpdateCandidateStatus(candidateId, newStatus);
        
        setShowInterviewModal(false);
        setInterviewForm({
          interview_type: 'phone',
          interviewer_id: employees[0]?.id.toString() || '1',
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

      try {
        const response = await fetch(`http://localhost:8080/api/recruitment/job-postings/${id}/`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        if (response.ok) {
          setJobs(jobs.filter((j) => j.id !== id));
          alert('✓ Job posting deleted successfully');
          // Update localStorage
          const updatedJobs = jobs.filter(j => j.id !== id);
          localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Delete API failed, using localStorage fallback:', apiError);
        
        // Fallback: Delete from local state and localStorage
        const updatedJobs = jobs.filter((j) => j.id !== id);
        setJobs(updatedJobs);
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        alert('✓ Job posting deleted (saved locally)');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(`Failed to delete job posting: ${error instanceof Error ? error.message : String(error)}`);
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

      try {
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
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Job posting API failed, using localStorage fallback:', apiError);
        
        // Fallback: Save to localStorage
        const newJob: JobPosting = {
          id: editingId || Math.max(...jobs.map(j => j.id), 0) + 1,
          title: formData.title,
          description: formData.description,
          posted_date: new Date().toISOString().split('T')[0],
          status: 'open',
          applications: 0,
        };

        if (editingId) {
          setJobs(jobs.map(j => j.id === editingId ? newJob : j));
          alert('✓ Job posting updated (saved locally)');
          setEditingId(null);
        } else {
          setJobs([...jobs, newJob]);
          alert('✓ Job posting created (saved locally)');
        }

        // Save to localStorage
        const allJobs = editingId 
          ? jobs.map(j => j.id === editingId ? newJob : j)
          : [...jobs, newJob];
        localStorage.setItem('jobPostings', JSON.stringify(allJobs));

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
      alert(`Failed to save job posting: ${error instanceof Error ? error.message : String(error)}`);
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

  // Helper function to extract name from filename
  const extractNameFromFilename = (filename: string): string => {
    // Remove extension
    let nameOnly = filename.replace(/\.[^/.]+$/, '');
    // Remove common CV/Resume keywords
    nameOnly = nameOnly.replace(/[-_](CV|Resume|cv|resume)/gi, '');
    nameOnly = nameOnly.replace(/[-_]/g, ' ');
    return nameOnly.trim();
  };

  // CV Processing Functions
  const extractCVData = (text: string, fileName: string = '') => {
    const cvData: any = {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      skills: [],
      experience: [],
      education: [],
      summary: '',
      rawText: text,
      isScanned: false, // Flag for scanned PDFs
      socialLinks: {
        github: '',
        linkedin: '',
        portfolio: '',
      },
      projectLinks: [] as string[],
      certificates: [] as string[],
    };

    // Check if this looks like a scanned/error PDF
    if (text.includes('[SCANNED_PDF]') || text.includes('[PDF_ERROR]') || text.includes('[DOCX_ERROR]') || text.includes('[TEXT_ERROR]')) {
      cvData.isScanned = true;
      // Extract name from filename as fallback
      if (fileName) {
        cvData.fullName = extractNameFromFilename(fileName);
      }
      console.log('⚠️ Detected scanned/error document, using filename fallback');
      return cvData;
    }

    // Extract email - multiple patterns
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) cvData.email = emailMatch[1];

    // Extract phone - multiple patterns
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?(?:\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|(?:\d{10}))/);
    if (phoneMatch) cvData.phone = phoneMatch[0].trim();

    // Extract name - more flexible patterns with better DOCX support
    let nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    if (!nameMatch) {
      // Try pattern: Name followed by title/contact info
      nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)\s*[-–•]?\s*(Senior|Junior|Lead|Manager|Developer|Engineer|Designer|Specialist|Architect|Director|Manager|Consultant)/i);
    }
    if (!nameMatch) {
      // Try pattern: Name before contact info
      nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s*[\r\n]+(Phone|Email|Email:|Phone:|Contact|LinkedIn|GitHub)/i);
    }
    if (!nameMatch) {
      // Try pattern with newlines (common in DOCX)
      nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s*\n\s*\n/);
    }
    if (!nameMatch) {
      // Try pattern: name at beginning, even with extra whitespace
      nameMatch = text.match(/^[\s]*([A-Z][a-z]+ [A-Z][a-z]+)/m);
    }
    if (nameMatch) {
      cvData.fullName = nameMatch[1].trim();
    } else if (fileName) {
      // Last resort: extract from filename
      cvData.fullName = extractNameFromFilename(fileName);
    }

    // Extract skills (looking for skill-related keywords) - EXPANDED LIST
    const skillKeywords = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Kotlin', 'Swift', 'Objective-C', 'R', 'MATLAB', 'Scala', 'Clojure', 'Haskell', 'Perl', 'Shell', 'Bash',
      // Frontend
      'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Ember', 'Backbone', 'jQuery', 'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap', 'Material UI',
      // Backend & Frameworks
      'Node.js', '.NET', 'Django', 'Flask', 'Spring', 'Spring Boot', 'Express', 'FastAPI', 'Rails', 'Sinatra', 'Laravel', 'Symfony', 'Fastify',
      // Databases
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle', 'SQLite', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra', 'Firestore', 'CosmosDB',
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform', 'Ansible', 'CloudFormation',
      // Tools & Technologies
      'Git', 'SVN', 'Agile', 'Scrum', 'Jira', 'Confluence', 'REST', 'GraphQL', 'API', 'Microservices', 'CI/CD', 'Linux', 'Windows', 'macOS', 'Nginx', 'Apache',
      // Data & Analytics
      'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Keras', 'Data Analysis', 'Big Data', 'Spark', 'Hadoop', 'Tableau', 'Power BI', 'Excel'
    ];
    cvData.skills = skillKeywords.filter(skill => {
      // Escape special regex characters in skill names
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      return regex.test(text);
    });

    // Extract years of experience - multiple patterns
    let expMatch = text.match(/(\d+)\s+years?\s+(?:of\s+)?(?:professional\s+)?experience/i);
    if (!expMatch) {
      expMatch = text.match(/(?:experience|exp)[\s:\n]+(\d+)\s+years?/i);
    }
    cvData.yearsOfExperience = expMatch ? parseInt(expMatch[1]) : 0;

    // Extract education/degrees
    const degreePatterns = [
      /(?:B\.?S\.?|Bachelor|B\.A\.?|B\.Tech|BSc|B\.E\.?)\s+(?:in|of)?\s+([A-Za-z\s]+)/gi,
      /(?:M\.?S\.?|Master|M\.A\.?|M\.Tech|MSc|M\.E\.?)\s+(?:in|of)?\s+([A-Za-z\s]+)/gi,
      /(?:PhD|Ph\.D\.?|Doctorate)\s+(?:in|of)?\s+([A-Za-z\s]+)/gi,
    ];
    degreePatterns.forEach(pattern => {
      let degreeMatch;
      while ((degreeMatch = pattern.exec(text)) !== null) {
        const degree = degreeMatch[0]?.trim();
        if (degree && !cvData.education.includes(degree)) {
          cvData.education.push(degree);
        }
      }
    });

    // Extract experience/work history
    const experiencePatterns = [
      /(?:^|\n)([A-Za-z\s]+)\s*[-–]\s*([A-Za-z\s,\.]+)\s*[\r\n]+([^\n]+)/gim,
      /(?:^|\n)(?:Role|Position|Title)[\s:]+([A-Za-z\s]+)/gim,
    ];
    experiencePatterns.forEach(pattern => {
      let expMatch;
      while ((expMatch = pattern.exec(text)) !== null) {
        const exp = expMatch[0]?.trim() || expMatch[1]?.trim();
        if (exp && exp.length > 5 && !cvData.experience.includes(exp)) {
          cvData.experience.push(exp.substring(0, 200));
        }
      }
    });

    // Enhanced summary extraction (first substantial paragraph)
    let summaryMatch = text.match(/(?:summary|overview|about|profile|objective)[\s:\n]+([\s\S]*?)(?:\n\n|EDUCATION|EXPERIENCE|SKILLS|employment|$)/i);
    if (summaryMatch) {
      cvData.summary = summaryMatch[1].substring(0, 300).trim();
    } else if (text.length > 100) {
      // Fallback: get first meaningful text, skip error markers
      const cleanText = text.replace(/\[(SCANNED_PDF|PDF_ERROR|DOCX_ERROR|TEXT_ERROR)[^\]]*\]/g, '')
        .replace(/^\s*(?:phone|email|location|linkedin|github)[^\n]*/gmi, '') // Remove contact lines
        .trim();
      
      // Get first paragraph
      const paragraphs = cleanText.split(/\n\n+/);
      if (paragraphs[0] && paragraphs[0].length > 30) {
        cvData.summary = paragraphs[0].substring(0, 300).trim();
      }
    }

    // Extract Social Links - GitHub, LinkedIn, Portfolio
    // GitHub - try multiple patterns
    let githubUrl = '';
    const githubPatterns = [
      /(https?:\/\/(?:www\.)?github\.com\/[\w\-\.]+)/i,
      /github\.com[\/:\s]+[\w\-\.]+/i,
      /github[\/:\s]+[\w\-\.]+/i,
    ];
    for (const pattern of githubPatterns) {
      const match = text.match(pattern);
      if (match) {
        githubUrl = match[1] || match[0];
        if (!githubUrl.startsWith('http')) {
          githubUrl = `https://github.com/${githubUrl.replace(/.*github[\/:\s]+/, '').split(/[\s,]/)[0]}`;
        }
        break;
      }
    }
    if (githubUrl) cvData.socialLinks.github = githubUrl;

    // LinkedIn - try multiple patterns
    let linkedinUrl = '';
    const linkedinPatterns = [
      /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-\.]+)/i,
      /linkedin\.com\/in[\/:\s]+[\w\-\.]+/i,
      /linkedin[\/:\s]+[\w\-\.]+/i,
    ];
    for (const pattern of linkedinPatterns) {
      const match = text.match(pattern);
      if (match) {
        linkedinUrl = match[1] || match[0];
        if (!linkedinUrl.startsWith('http')) {
          linkedinUrl = `https://linkedin.com/in/${linkedinUrl.replace(/.*linkedin[\/:\s]+/, '').split(/[\s,]/)[0]}`;
        }
        break;
      }
    }
    if (linkedinUrl) cvData.socialLinks.linkedin = linkedinUrl;

    // Portfolio/Personal Website
    const portfolioMatch = text.match(/(https?:\/\/(?:www\.)?[\w\-]+\.(?:com|io|dev|net|co|org))/i);
    if (portfolioMatch && !portfolioMatch[1].includes('linkedin') && !portfolioMatch[1].includes('github')) {
      cvData.socialLinks.portfolio = portfolioMatch[1];
    }

    // Log extracted social links
    if (cvData.socialLinks.github || cvData.socialLinks.linkedin || cvData.socialLinks.portfolio) {
      console.log(`🔗 Social Links found:`, cvData.socialLinks);
    }

    // Extract Project Links (URLs that might be projects)
    // More comprehensive regex to catch various GitHub/GitLab/Bitbucket project URLs
    const projectPatterns = [
      /(https?:\/\/github\.com\/[\w\-]+\/[\w\-\.]+)/gi,
      /(https?:\/\/gitlab\.com\/[\w\-]+\/[\w\-\.]+)/gi,
      /(https?:\/\/bitbucket\.org\/[\w\-]+\/[\w\-\.]+)/gi,
      /(https?:\/\/(?:gist\.)?github\.com\/[\w\-]+\/[\w\-]+)/gi,
    ];
    
    projectPatterns.forEach(pattern => {
      let match;
      const tempRegex = new RegExp(pattern.source, 'gi');
      while ((match = tempRegex.exec(text)) !== null) {
        const url = match[1] || match[0];
        if (!cvData.projectLinks.includes(url)) {
          cvData.projectLinks.push(url);
        }
      }
    });

    if (cvData.projectLinks.length > 0) {
      console.log(`🔗 Project Links found:`, cvData.projectLinks);
    }

    // Extract Certificates and Certifications
    const certPatterns = [
      /(?:certification|certificate|certified|cert)[:\s]+([^\n]+)/gi,
      /(?:AWS|Azure|GCP|Kubernetes|Docker|Certified)[\s]+([A-Z][^\n]*)/gi,
      /(?:CISPE|CompTIA|Oracle|Microsoft|Google Cloud)[\s]+([A-Z][^\n]*)/gi,
    ];
    
    certPatterns.forEach(pattern => {
      let certMatch;
      while ((certMatch = pattern.exec(text)) !== null) {
        const cert = certMatch[1]?.trim() || certMatch[0]?.trim();
        if (cert && cert.length > 3 && !cvData.certificates.includes(cert)) {
          cvData.certificates.push(cert.substring(0, 100)); // Limit cert length
        }
      }
    });

    console.log('✓ Extracted CV data:', cvData);
    return cvData;
  };

  const handleCVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      console.log('No files selected');
      return;
    }

    console.log(`Starting import of ${files.length} file(s)`);
    const newCVs: any[] = [];
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      try {
        let text = '';
        let extractionMethod = 'unknown';
        
        if (file.type === 'application/pdf') {
          extractionMethod = 'PDF';
          let lastError = '';
          
          try {
            const arrayBuffer = await file.arrayBuffer();
            console.log(`📄 PDF: ${file.name}, size: ${arrayBuffer.byteLength} bytes`);
            
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            console.log(`✓ PDF loaded successfully, pages: ${pdf.numPages}`);
            
            let totalPageText = '';
            for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
              try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
                totalPageText += pageText + '\n';
                console.log(`  Page ${pageNum}: ${pageText.length} chars - ${pageText.substring(0, 100)}...`);
              } catch (pageError) {
                console.warn(`⚠️ Page ${pageNum} extraction failed:`, pageError);
                lastError = String(pageError);
              }
            }
            
            text = totalPageText;
            console.log(`📊 Total extracted from PDF: ${text.length} characters`);
            
            // If PDF extraction is empty, it's likely a scanned image
            if (text.trim().length === 0) {
              console.warn('⚠️ PDF contains no extractable text (likely scanned image or image-based PDF)');
              // For scanned PDFs, we'll create a CV entry but mark it needs manual review
              text = `[SCANNED_PDF] Filename: ${file.name}`;
            }
          } catch (pdfError) {
            lastError = String(pdfError);
            console.error(`❌ PDF extraction completely failed:`, pdfError);
            // Create placeholder entry indicating manual review needed
            text = `[PDF_ERROR] ${file.name} - Error: ${lastError}`;
          }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
          extractionMethod = 'DOCX';
          try {
            const arrayBuffer = await file.arrayBuffer();
            // Try both extractRawText and extractText for better coverage
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
            
            // Also try to get structured text if available
            const structuredResult = await mammoth.convertToHtml({ arrayBuffer });
            if (structuredResult && structuredResult.value && text.length < 500) {
              // If raw text is too short, try to extract from HTML
              const htmlText = structuredResult.value
                .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' '); // Normalize whitespace
              text = text + ' ' + htmlText;
            }
            
            console.log(`✓ DOCX extracted: ${text.length} characters`);
            console.log(`  First 200 chars: ${text.substring(0, 200)}`);
          } catch (docxError) {
            console.error(`❌ DOCX extraction failed:`, docxError);
            text = `[DOCX_ERROR] ${file.name}`;
          }
        } else {
          extractionMethod = 'TEXT';
          try {
            text = await file.text();
            console.log(`✓ Text file read: ${text.length} characters`);
          } catch (textError) {
            console.error(`❌ Text file reading failed:`, textError);
            text = `[TEXT_ERROR] ${file.name}`;
          }
        }

        const cvData = extractCVData(text, file.name);
        const newCV = {
          id: Date.now() + i,
          fileName: file.name,
          ...cvData,
          status: 'pending',
          approvedBy: '',
          approvalDate: '',
          notes: '',
        };
        console.log(`CV data extracted for ${file.name}:`, newCV);
        newCVs.push(newCV);
        successCount++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Completed processing. Success count: ${successCount}, Total CVs to add: ${newCVs.length}`);
    console.log('Current importedCVData:', importedCVData);

    if (newCVs.length > 0) {
      const updatedCVs = [...importedCVData, ...newCVs];
      console.log('Updated CVs array:', updatedCVs);
      
      setImportedCVData(updatedCVs);
      localStorage.setItem('importedCVs', JSON.stringify(updatedCVs));
      
      console.log('After setImportedCVData - localStorage:', localStorage.getItem('importedCVs'));
      
      // Prepare success message with data quality summary
      const dataQualitySummary = newCVs.map(cv => {
        const fields = [cv.fullName, cv.email, cv.phone, cv.yearsOfExperience > 0].filter(Boolean).length;
        return `${cv.fileName}: ${fields + cv.skills.length} data points extracted`;
      }).join(' | ');
      
      alert(`✓ Successfully imported ${successCount} CV(s)\n\n${dataQualitySummary}`);
      
      // Reset file input
      event.target.value = '';
      console.log('Import completed successfully');
    } else {
      alert('No CVs could be imported. Please check the file format.');
    }
  };

  const handleApproveCVData = (cvId: any, approved: boolean, notes: string) => {
    console.log(`Approving CV ${cvId}: approved=${approved}, notes=${notes}`);
    const updatedCVData = importedCVData.map((cv) =>
      cv.id === cvId
        ? { ...cv, status: approved ? 'approved' : 'rejected', approvalDate: new Date().toISOString().split('T')[0], notes }
        : cv
    );
    console.log('Updated CV data:', updatedCVData);
    setImportedCVData(updatedCVData);
    localStorage.setItem('importedCVs', JSON.stringify(updatedCVData));
    setShowCVApprovalModal(false);
    setSelectedCVData(null);
    alert(`✓ CV ${approved ? 'approved' : 'rejected'} successfully`);
  };

  const handleDeleteRejectedCV = (cvId: any) => {
    if (confirm('Are you sure you want to permanently delete this rejected CV? This action cannot be undone.')) {
      const updatedCVData = importedCVData.filter((cv) => cv.id !== cvId);
      setImportedCVData(updatedCVData);
      localStorage.setItem('importedCVs', JSON.stringify(updatedCVData));
      alert('✓ CV deleted from history');
    }
  };

  const handleScheduleInterview = async () => {
    if (!scheduleInterviewForm.candidateId || !scheduleInterviewForm.scheduledDate || !scheduleInterviewForm.interviewerId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get candidate from imported CVs instead of candidates list
      const cvCandidate = importedCVData.find(cv => cv.id === parseInt(scheduleInterviewForm.candidateId));
      const interviewer = employees.find(emp => emp.id === parseInt(scheduleInterviewForm.interviewerId));

      if (!cvCandidate) {
        alert('Selected candidate not found');
        return;
      }

      // Map interview type to system types
      const typeMap: Record<string, 'phone' | 'technical' | 'behavioral' | 'final'> = {
        'Initial Screening': 'phone',
        'Technical Interview': 'technical',
        'Behavioral Interview': 'behavioral',
        'Final Round': 'final',
        'HR Interview': 'phone',
      };

      const newInterview: Interview = {
        id: Date.now(),
        candidate: parseInt(scheduleInterviewForm.candidateId),
        interview_type: typeMap[scheduleInterviewForm.interviewType] || 'phone',
        status: 'scheduled',
        scheduled_date: `${scheduleInterviewForm.scheduledDate}T${scheduleInterviewForm.time}`,
        duration_minutes: parseInt(scheduleInterviewForm.duration),
        interviewer: parseInt(scheduleInterviewForm.interviewerId),
        interviewer_name: interviewer?.name || '',
        location: scheduleInterviewForm.location,
        feedback: '',
        rating: scheduleInterviewForm.grading ? parseInt(scheduleInterviewForm.grading) : 0,
        created_at: new Date().toISOString(),
      };

      const updatedInterviews = [...interviews, newInterview];
      setInterviews(updatedInterviews);
      localStorage.setItem('interviews', JSON.stringify(updatedInterviews));
      
      alert(`✓ Interview scheduled for ${cvCandidate?.fullName}`);
      setShowScheduleInterviewModal(false);
      setScheduleInterviewForm({
        candidateId: '',
        interviewType: 'Initial Screening',
        scheduledDate: '',
        time: '',
        duration: '60',
        interviewerId: '',
        location: 'Virtual',
        grading: '',
      });
    } catch (error) {
      alert('Failed to schedule interview: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateInterviewStatus = (interviewId: number, newStatus: Interview['status']) => {
    setInterviews(
      interviews.map((interview) =>
        interview.id === interviewId ? { ...interview, status: newStatus } : interview
      )
    );
    localStorage.setItem('interviews', JSON.stringify(interviews));
  };

  const handleContinueInterview = (rating: string, feedback: string) => {
    if (!selectedInterviewToContinue || !rating || !feedback.trim()) {
      alert('Please fill in all fields (rating and feedback)');
      return;
    }

    setInterviews(
      interviews.map((interview) =>
        interview.id === selectedInterviewToContinue.id
          ? {
              ...interview,
              status: 'completed',
              rating: parseInt(rating),
              feedback: feedback,
            }
          : interview
      )
    );

    localStorage.setItem('interviews', JSON.stringify(interviews));
    alert('✓ Interview completed successfully!');
    setShowContinueInterviewModal(false);
    setContinueInterviewForm({ rating: '', feedback: '' });
    setSelectedInterviewToContinue(null);
  };

  const getInterviewStats = () => {
    return {
      total: interviews.length,
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      byDepartment: DEPARTMENTS.map(dept => ({
        dept,
        count: interviews.filter(i => {
          const interviewer = employees.find((emp: any) => emp.id === i.interviewer);
          return interviewer?.department === dept;
        }).length,
      })),
    };
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
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Job Postings
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Candidates
            </button>
            <button
              onClick={() => setActiveTab('cv-management')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'cv-management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 CV Management
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎤 Interviews
            </button>
          </div>

          {(activeTab === 'jobs' || activeTab === 'candidates') && (
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
          )}

          {/* CV MANAGEMENT TAB */}
          {activeTab === 'cv-management' && (
            <div className="w-full space-y-6">
              {/* CV Import Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📥 Import & Extract CV Data</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="cv-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleCVImport}
                    className="hidden"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-gray-700 font-medium">Click to upload CVs or drag and drop</p>
                    <p className="text-gray-500 text-sm mt-1">PDF, Word, or Text files accepted</p>
                  </label>
                </div>
              </div>

              {/* CV Filter */}
              <div className="bg-white rounded-lg shadow p-4">
                <select
                  value={cvFilter}
                  onChange={(e) => setCVFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Active CVs (Pending & Approved)</option>
                  <option value="approved">✓ Approved Only</option>
                  <option value="pending">⏳ Pending Only</option>
                  <option value="rejected">📋 History (Rejected)</option>
                </select>
              </div>

              {/* Imported CVs Grid - Main View (excludes rejected by default) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importedCVData
                  .filter(cv => {
                    if (cvFilter === 'rejected') return cv.status === 'rejected';
                    if (cvFilter === 'all') return cv.status !== 'rejected';
                    return cv.status === cvFilter;
                  })
                  .map((cv) => {
                  // Calculate data quality score
                  const fieldsExtracted = [cv.fullName, cv.email, cv.phone, cv.yearsOfExperience > 0].filter(Boolean).length;
                  const dataQuality = ((fieldsExtracted + cv.skills.length) / 6) * 100;
                  
                  return (
                  <div key={cv.id} className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 ${
                    cv.isScanned ? 'border-orange-500 bg-orange-50' : 'border-blue-500'
                  }`}>
                    {/* Header with File Name and Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-lg">{cv.fileName}</h4>
                          {cv.isScanned && (
                            <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded font-medium">
                              📎 Scanned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">Imported: {new Date(cv.id).toLocaleDateString()}</p>
                          <div className="text-xs">
                            {dataQuality >= 75 ? (
                              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">✓ Complete</span>
                            ) : dataQuality >= 40 ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">◐ Partial</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">◑ Minimal</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        cv.status === 'approved' ? 'bg-green-100 text-green-800' :
                        cv.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cv.status === 'approved' ? '✓ Approved' : cv.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Extracted Candidate Info */}
                    <div className="bg-gray-50 rounded p-3 mb-4 space-y-2 border border-gray-200">
                      {cv.fullName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm font-medium">👤 Name:</span>
                          <span className="text-gray-900 font-semibold">{cv.fullName}</span>
                        </div>
                      )}
                      {cv.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm font-medium">📧 Email:</span>
                          <span className="text-blue-600 text-sm font-mono">{cv.email}</span>
                        </div>
                      )}
                      {cv.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm font-medium">📱 Phone:</span>
                          <span className="text-gray-900 font-semibold">{cv.phone}</span>
                        </div>
                      )}
                      {cv.yearsOfExperience > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm font-medium">💼 Experience:</span>
                          <span className="text-gray-900 font-semibold">{cv.yearsOfExperience} years</span>
                        </div>
                      )}
                      {!cv.fullName && !cv.email && !cv.phone && cv.yearsOfExperience === 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-500 italic">ℹ️ Click "👁️ Review" to see extracted CV data</p>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {cv.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 font-bold mb-2 uppercase">🛠️ Skills ({cv.skills.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {cv.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {cv.summary && (
                      <div className="mb-4 bg-blue-50 rounded p-3 border border-blue-200">
                        <p className="text-xs text-gray-700 font-medium mb-2">📝 Summary</p>
                        <p className="text-xs text-gray-600 line-clamp-3">{cv.summary}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t pt-3 mt-3">
                      <button
                        onClick={() => {
                          setSelectedCVData(cv);
                          setShowCVApprovalModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium"
                      >
                        👁️ Review
                      </button>
                      {cv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveCVData(cv.id, true, '')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition font-medium"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleApproveCVData(cv.id, false, '')}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition font-medium"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {cv.status === 'rejected' && (
                        <button
                          onClick={() => handleDeleteRejectedCV(cv.id)}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition font-medium"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {importedCVData
                .filter(cv => {
                  if (cvFilter === 'rejected') return cv.status === 'rejected';
                  if (cvFilter === 'all') return cv.status !== 'rejected';
                  return cv.status === cvFilter;
                })
                .length === 0 && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">
                    {importedCVData.length === 0 
                      ? 'No CVs imported yet. Upload CVs to get started.' 
                      : cvFilter === 'rejected'
                      ? 'No rejected CVs in history.'
                      : `No ${cvFilter === 'pending' ? 'pending' : cvFilter === 'approved' ? 'approved' : 'CVs'}. Try a different filter.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* INTERVIEWS TAB */}
          {activeTab === 'interviews' && (
            <div className="w-full space-y-6">
              {/* Interview Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Interviews</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{getInterviewStats().total}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Scheduled</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{getInterviewStats().scheduled}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{getInterviewStats().completed}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{getInterviewStats().cancelled}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">By Department</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {getInterviewStats().byDepartment.map((item) => (
                      <div key={item.dept} className="flex justify-between">
                        <span className="text-gray-700">{item.dept}:</span>
                        <strong className="text-blue-600">{item.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule Interview Button */}
              <div className="bg-white rounded-lg shadow p-4">
                <button
                  onClick={() => setShowScheduleInterviewModal(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg flex items-center justify-center gap-2"
                >
                  📅 Schedule New Interview
                </button>
              </div>

              {/* Interview Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg shadow p-4">
                <select
                  value={interviewFilter}
                  onChange={(e) => setInterviewFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Interviews</option>
                  <option value="scheduled">📅 Scheduled</option>
                  <option value="completed">✓ Completed</option>
                  <option value="cancelled">✕ Cancelled</option>
                </select>
                <select
                  value={interviewDepartmentFilter}
                  onChange={(e) => setInterviewDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Interviews List */}
              <div className="space-y-4">
                {interviews
                  .filter(i => interviewFilter === 'all' || i.status === interviewFilter)
                  .filter(i => {
                    if (interviewDepartmentFilter === 'all') return true;
                    const interviewer = employees.find((emp: any) => emp.id === i.interviewer);
                    return interviewer?.department === interviewDepartmentFilter;
                  })
                  .map((interview) => {
                    const candidate = candidates.find(c => c.id === interview.candidate);
                    const interviewer = employees.find((emp: any) => emp.id === interview.interviewer);
                    return (
                      <div key={interview.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {candidate?.first_name} {candidate?.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{candidate?.job_posting_title}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                              interview.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {interview.status === 'completed' ? '✓ Completed' : 
                               interview.status === 'scheduled' ? '📅 Scheduled' : '✕ Cancelled'}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {interview.interview_type}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-200">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Date</p>
                            <p className="text-sm text-gray-900 font-semibold">{interview.scheduled_date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Time</p>
                            <p className="text-sm text-gray-900 font-semibold">{interview.duration_minutes} mins</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Interviewer</p>
                            <p className="text-sm text-gray-900 font-semibold">{interviewer?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Department</p>
                            <p className="text-sm text-gray-900 font-semibold">{interviewer?.department}</p>
                          </div>
                        </div>

                        {/* Interviewer Status */}
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Interviewer Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              interviewer?.accepted ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {interviewer?.accepted ? '✓ Accepted' : '⏳ Pending Acceptance'}
                            </span>
                          </p>
                          {interviewer?.role && (
                            <p className="text-xs text-gray-600">Role: {interviewer.role}</p>
                          )}
                        </div>

                        {interview.location && (
                          <p className="text-sm text-gray-700 mb-4"><strong>Location:</strong> {interview.location}</p>
                        )}

                        {/* Grading/Rating */}
                        {interview.rating > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-gray-700 mb-2"><strong>Rating:</strong></p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-xl ${star <= interview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 mt-2">{interview.rating}/5 - {
                              interview.rating === 1 ? 'Poor' :
                              interview.rating === 2 ? 'Below Average' :
                              interview.rating === 3 ? 'Average' :
                              interview.rating === 4 ? 'Good' :
                              'Excellent'
                            }</p>
                          </div>
                        )}

                        {/* Feedback */}
                        {interview.feedback && (
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700 mb-2"><strong>Feedback:</strong></p>
                            <p className="text-sm text-gray-600">{interview.feedback}</p>
                          </div>
                        )}

                        {/* Status Update Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {interview.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedInterviewToContinue(interview);
                                  setShowContinueInterviewModal(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium"
                              >
                                ➜ Continue Interview
                              </button>
                              <button
                                onClick={() => handleUpdateInterviewStatus(interview.id, 'cancelled')}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition font-medium"
                              >
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {interviews.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No interviews scheduled yet. Select a candidate to schedule an interview.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {showScheduleInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">📅 Schedule Interview</h2>
              <button
                onClick={() => setShowScheduleInterviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Select Candidate from CV */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate (from CV) *</label>
                <select
                  value={scheduleInterviewForm.candidateId}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, candidateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a candidate</option>
                  {Array.from(
                    new Map(
                      importedCVData
                        .filter(cv => cv.status === 'approved' && cv.fullName) // Only approved CVs with names
                        .map(cv => [cv.fullName, cv]) // Create map with fullName as key for uniqueness
                    ).values()
                  ).map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.fullName} ({cv.fileName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Interview Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type *</label>
                <select
                  value={scheduleInterviewForm.interviewType}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, interviewType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Initial Screening">Initial Screening</option>
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="Behavioral Interview">Behavioral Interview</option>
                  <option value="Final Round">Final Round</option>
                  <option value="HR Interview">HR Interview</option>
                </select>
              </div>

              {/* Interview Interviewer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer *</label>
                <select
                  value={scheduleInterviewForm.interviewerId}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, interviewerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an interviewer</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={scheduleInterviewForm.scheduledDate}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  value={scheduleInterviewForm.time}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                <input
                  type="number"
                  value={scheduleInterviewForm.duration}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, duration: e.target.value })}
                  min="15"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={scheduleInterviewForm.location}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, location: e.target.value })}
                  placeholder="e.g., Virtual, Conference Room A, Office Building"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Grading Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Grading Scale</label>
                <select
                  value={scheduleInterviewForm.grading}
                  onChange={(e) => setScheduleInterviewForm({ ...scheduleInterviewForm, grading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific scale</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Below Average</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t pt-4">
                <button
                  onClick={handleScheduleInterview}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  📅 Schedule Interview
                </button>
                <button
                  onClick={() => setShowScheduleInterviewModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV APPROVAL MODAL */}
      {showCVApprovalModal && selectedCVData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review CV</h2>
                <p className="text-gray-600 mt-1">{selectedCVData.fileName}</p>
              </div>
              <button
                onClick={() => {
                  setShowCVApprovalModal(false);
                  setSelectedCVData(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning for scanned PDFs */}
              {selectedCVData.isScanned && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                  <p className="text-orange-800 text-sm font-medium">⚠️ Limited Text Extraction</p>
                  <p className="text-orange-700 text-xs mt-1">
                    This PDF appears to be a scanned image or has no extractable text. Please review the CV and manually add candidate information as needed.
                  </p>
                </div>
              )}

              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Extracted Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCVData.fullName && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Full Name</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedCVData.fullName}</p>
                    </div>
                  )}
                  {selectedCVData.email && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Email</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedCVData.email}</p>
                    </div>
                  )}
                  {selectedCVData.phone && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Phone</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedCVData.phone}</p>
                    </div>
                  )}
                  {selectedCVData.yearsOfExperience > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Experience</p>
                      <p className="text-sm text-gray-900 font-semibold">{selectedCVData.yearsOfExperience} years</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {selectedCVData.skills && selectedCVData.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">💼 Skills Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCVData.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedCVData.summary && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">📝 Summary</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedCVData.summary}</p>
                </div>
              )}

              {/* Social Links */}
              {selectedCVData.socialLinks && (selectedCVData.socialLinks.github || selectedCVData.socialLinks.linkedin || selectedCVData.socialLinks.portfolio) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">🔗 Social Links</p>
                  <div className="space-y-1">
                    {selectedCVData.socialLinks.github && (
                      <a href={selectedCVData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        🐙 GitHub: {selectedCVData.socialLinks.github}
                      </a>
                    )}
                    {selectedCVData.socialLinks.linkedin && (
                      <a href={selectedCVData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        in LinkedIn: {selectedCVData.socialLinks.linkedin}
                      </a>
                    )}
                    {selectedCVData.socialLinks.portfolio && (
                      <a href={selectedCVData.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        🌐 Portfolio: {selectedCVData.socialLinks.portfolio}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedCVData.projectLinks && selectedCVData.projectLinks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">📦 Projects</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedCVData.projectLinks.map((link: string, idx: number) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs block truncate">
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {selectedCVData.certificates && selectedCVData.certificates.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">🏆 Certificates & Certifications</p>
                  <div className="space-y-1">
                    {selectedCVData.certificates.map((cert: string, idx: number) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-2 rounded">
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw CV Text */}
              {selectedCVData.rawText && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">📄 Full CV Text</p>
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 max-h-64 overflow-y-auto border border-gray-200 whitespace-pre-wrap">
                    {selectedCVData.rawText.substring(0, 1000)}
                    {selectedCVData.rawText.length > 1000 && '...'}
                  </div>
                </div>
              )}

              {/* Approval Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Approval Notes</label>
                <textarea
                  value={cvApprovalForm.notes}
                  onChange={(e) => setCVApprovalForm({ ...cvApprovalForm, notes: e.target.value })}
                  placeholder="Add any notes about this CV..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t pt-4">
                <button
                  onClick={() => {
                    handleApproveCVData(selectedCVData.id, true, cvApprovalForm.notes);
                    setCVApprovalForm({ cv_id: '', approved: false, notes: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    handleApproveCVData(selectedCVData.id, false, cvApprovalForm.notes);
                    setCVApprovalForm({ cv_id: '', approved: false, notes: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                >
                  ✕ Reject
                </button>
                <button
                  onClick={() => {
                    setShowCVApprovalModal(false);
                    setSelectedCVData(null);
                    setCVApprovalForm({ cv_id: '', approved: false, notes: '' });
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
                  {(
                    [
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
                    ] as const
                  ).map((status: Candidate['status']) => (
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
                          setInterviewForm({ ...interviewForm, interviewer_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {employees.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.position}
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
                  onClick={() => handleScheduleInterview()}
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

      {/* CONTINUE INTERVIEW MODAL */}
      {showContinueInterviewModal && selectedInterviewToContinue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">➜ Continue Interview</h2>
              <button
                onClick={() => {
                  setShowContinueInterviewModal(false);
                  setSelectedInterviewToContinue(null);
                  setContinueInterviewForm({ rating: '', feedback: '' });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Interview Details - Read Only */}
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-700"><strong>Candidate:</strong> {selectedInterviewToContinue.candidate}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Interview Type:</strong> {selectedInterviewToContinue.interview_type}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Scheduled:</strong> {selectedInterviewToContinue.scheduled_date}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Interviewer:</strong> {selectedInterviewToContinue.interviewer_name}</p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5) *</label>
                <select
                  value={continueInterviewForm.rating}
                  onChange={(e) => setContinueInterviewForm({ ...continueInterviewForm, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select rating</option>
                  <option value="1">⭐ 1 - Poor (Need improvement)</option>
                  <option value="2">⭐⭐ 2 - Fair (Below expectations)</option>
                  <option value="3">⭐⭐⭐ 3 - Good (Meets expectations)</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Very Good (Exceeds expectations)</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent (Outstanding)</option>
                </select>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback *</label>
                <textarea
                  value={continueInterviewForm.feedback}
                  onChange={(e) => setContinueInterviewForm({ ...continueInterviewForm, feedback: e.target.value })}
                  placeholder="Enter detailed feedback about the interview..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleContinueInterview(continueInterviewForm.rating, continueInterviewForm.feedback)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                >
                  ✓ Complete Interview
                </button>
                <button
                  onClick={() => {
                    setShowContinueInterviewModal(false);
                    setSelectedInterviewToContinue(null);
                    setContinueInterviewForm({ rating: '', feedback: '' });
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
    </div>
  );
}
