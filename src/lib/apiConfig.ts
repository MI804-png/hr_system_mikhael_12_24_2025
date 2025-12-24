/**
 * API Configuration for HR System Frontend
 * This file contains all API endpoints and configuration for connecting to the Django backend
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${API_BASE_URL}/api/auth/login/`,
    refresh: `${API_BASE_URL}/api/auth/refresh/`,
    logout: `${API_BASE_URL}/api/auth/logout/`,
  },

  // Core
  core: {
    departments: `${API_BASE_URL}/api/core/departments/`,
    jobPositions: `${API_BASE_URL}/api/core/job-positions/`,
  },

  // HR Management
  employees: `${API_BASE_URL}/api/employees/`,
  attendance: `${API_BASE_URL}/api/attendance/`,
  leave: `${API_BASE_URL}/api/leave/`,

  // Recruitment
  recruitment: {
    jobs: `${API_BASE_URL}/api/recruitment/jobs/`,
    applications: `${API_BASE_URL}/api/recruitment/applications/`,
    candidates: `${API_BASE_URL}/api/recruitment/candidates/`,
  },

  // Payroll & Benefits
  payroll: `${API_BASE_URL}/api/payroll/`,
  benefits: `${API_BASE_URL}/api/benefits/`,
  compensation: `${API_BASE_URL}/api/compensation/`,

  // Performance
  performance: {
    reviews: `${API_BASE_URL}/api/performance/reviews/`,
    goals: `${API_BASE_URL}/api/performance/goals/`,
  },

  // Training
  training: `${API_BASE_URL}/api/training/`,

  // Strategic HR
  equity: `${API_BASE_URL}/api/equity/`,
  retention: `${API_BASE_URL}/api/retention/`,
  succession: `${API_BASE_URL}/api/succession/`,

  // Compliance
  compliance: {
    policies: `${API_BASE_URL}/api/hr-compliance/policies/`,
    regulations: `${API_BASE_URL}/api/hr-compliance/regulations/`,
    audits: `${API_BASE_URL}/api/hr-compliance/audits/`,
  },

  // CSR & Sustainability
  csr: `${API_BASE_URL}/api/csr/`,
  sustainability: `${API_BASE_URL}/api/sustainability/`,

  // Data & Reporting
  reports: `${API_BASE_URL}/api/reports/`,
  dataExport: `${API_BASE_URL}/api/data/`,
};

// API Configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for CSRF protection
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
};
