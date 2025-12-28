'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import NotificationCenter from './NotificationCenter';

interface SearchResult {
  id: string;
  type: 'employee' | 'page' | 'action';
  title: string;
  description: string;
  link?: string;
}

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Mock employee data for global search
  const mockEmployees = [
    { id: 1, name: 'John Doe', position: 'Senior Developer', department: 'Engineering' },
    { id: 2, name: 'Jane Smith', position: 'Project Manager', department: 'Management' },
    { id: 3, name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources' },
    { id: 4, name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering' },
    { id: 5, name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design' },
  ];

  // Mock pages for navigation
  const mockPages = [
    { id: 'page-1', title: 'Employees', link: '/employees' },
    { id: 'page-2', title: 'Payroll', link: '/payroll' },
    { id: 'page-3', title: 'Attendance', link: '/attendance' },
    { id: 'page-4', title: 'Reports', link: '/reports' },
    { id: 'page-5', title: 'Settings', link: '/settings' },
  ];

  // Global search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search employees
    mockEmployees.forEach(emp => {
      if (emp.name.toLowerCase().includes(query) || 
          emp.position.toLowerCase().includes(query) ||
          emp.department.toLowerCase().includes(query)) {
        results.push({
          id: `emp-${emp.id}`,
          type: 'employee',
          title: emp.name,
          description: `${emp.position} • ${emp.department}`,
          link: `/employees?search=${emp.name}`,
        });
      }
    });

    // Search pages
    mockPages.forEach(page => {
      if (page.title.toLowerCase().includes(query)) {
        results.push({
          id: page.id,
          type: 'page',
          title: page.title,
          description: 'Navigate to page',
          link: page.link,
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/employees?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.link) {
      router.push(result.link);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleNotificationClick = (id: number) => {
    console.log('Notification clicked:', id);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees, pages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              🔍
            </button>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{result.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{result.description}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {result.type === 'employee' ? '👤' : result.type === 'page' ? '📄' : '⚡'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 text-center">
                <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center space-x-6 ml-8">
          {/* Notifications Center */}
          <NotificationCenter />

          {/* User Menu */}
          <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition">
              A
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
