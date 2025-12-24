'use client';

import { useState } from 'react';
import { Briefcase, Plus, Filter, Search } from 'lucide-react';

interface JobOpening {
  id: number;
  title: string;
  department: string;
  applicants: number;
  status: 'open' | 'closed' | 'filled';
  postedDate: string;
  deadline: string;
}

export default function Recruitment() {
  const [jobs] = useState<JobOpening[]>([
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      applicants: 24,
      status: 'open',
      postedDate: '2024-11-01',
      deadline: '2025-01-31',
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      applicants: 18,
      status: 'open',
      postedDate: '2024-11-15',
      deadline: '2025-01-15',
    },
    {
      id: 3,
      title: 'Marketing Manager',
      department: 'Marketing',
      applicants: 12,
      status: 'open',
      postedDate: '2024-12-01',
      deadline: '2025-02-01',
    },
    {
      id: 4,
      title: 'HR Specialist',
      department: 'HR',
      applicants: 8,
      status: 'closed',
      postedDate: '2024-10-01',
      deadline: '2024-12-31',
    },
  ]);

  const getStatusColor = (status: JobOpening['status']) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const openJobs = jobs.filter(j => j.status === 'open').length;
  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-600 mt-2">Manage job openings and recruitment process</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-5 h-5" />
          <span>New Job Opening</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Open Positions</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{openJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Applicants</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totalApplicants}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Positions Filled</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{jobs.filter(j => j.status === 'filled').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search job openings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Filter className="w-5 h-5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.department}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>

            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-600">Applicants</p>
                <p className="text-2xl font-bold text-gray-900">{job.applicants}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Posted</p>
                  <p className="text-sm text-gray-900">{job.postedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Deadline</p>
                  <p className="text-sm text-gray-900">{job.deadline}</p>
                </div>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
