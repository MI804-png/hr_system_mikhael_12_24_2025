'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('hr');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/login');
      alert('✓ You have been logged out successfully');
    }
  };

  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-y-auto h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">HR System</h1>
        <p className="text-blue-200 text-xs mt-1">Management Platform</p>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2 flex-1">
        {/* Dashboard */}
        <Link 
          href="/" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
            isActive('/') ? 'bg-blue-700' : 'hover:bg-blue-700'
          }`}
        >
          📊 Dashboard
        </Link>

        {/* HR Management */}
        <div>
          <button 
            onClick={() => toggleMenu('hr')}
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <span>👥 HR Management</span>
            <span className={`transition-transform ${expandedMenu === 'hr' ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedMenu === 'hr' && (
            <div className="ml-4 space-y-2 mt-2">
              {/* Employees - Admin Only */}
              {user?.role === 'admin' && (
                <Link 
                  href="/employees" 
                  className={`block px-4 py-2 text-sm rounded transition ${
                    isActive('/employees') ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  Employees
                </Link>
              )}
              
              {/* Attendance - Employees Only */}
              {user?.role !== 'admin' && (
                <Link 
                  href="/attendance" 
                  className={`block px-4 py-2 text-sm rounded transition ${
                    isActive('/attendance') ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  Sign In/Out
                </Link>
              )}
              
              {/* Salary - Admin & Employees */}
              {user?.role === 'admin' || user?.role === 'employee' ? (
                <Link 
                  href="/salary" 
                  className={`block px-4 py-2 text-sm rounded transition ${
                    isActive('/salary') ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  {user?.role === 'admin' ? 'Salary & Payroll' : '💰 My Salary'}
                </Link>
              ) : null}
            </div>
          )}
        </div>

        {/* Recruitment - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/recruitment" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/recruitment') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            🎯 Recruitment
          </Link>
        )}

        {/* Payroll - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/payroll" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/payroll') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            💰 Payroll
          </Link>
        )}

        {/* Permissions - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/permissions" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/permissions') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            🔐 Manage Permissions
          </Link>
        )}

        {/* Admin Deductions - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/admin-deductions" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/admin-deductions') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            💳 Admin Deductions
          </Link>
        )}

        {/* Performance - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/performance" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/performance') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            ⭐ Performance
          </Link>
        )}

        {/* Reports - Admin Only */}
        {user?.role === 'admin' && (
          <Link 
            href="/reports" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/reports') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            📈 Reports
          </Link>
        )}

        {/* Cafeteria System */}
        {(user?.role === 'admin' || user?.role === 'cafeteria_worker') && (
          <div>
            <button 
              onClick={() => toggleMenu('cafeteria')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <span>🍽️ Cafeteria</span>
              <span className={`transition-transform ${expandedMenu === 'cafeteria' ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedMenu === 'cafeteria' && (
              <div className="ml-4 space-y-2 mt-2">
                <Link 
                  href="/cafeteria" 
                  className={`block px-4 py-2 text-sm rounded transition ${
                    isActive('/cafeteria') ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  Menu & Inventory
                </Link>
                <Link 
                  href="/cafeteria-orders" 
                  className={`block px-4 py-2 text-sm rounded transition ${
                    isActive('/cafeteria-orders') ? 'bg-blue-700' : 'hover:bg-blue-700'
                  }`}
                >
                  Orders
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Cafeteria Ordering - Employees Only */}
        {user?.role === 'employee' && (
          <Link 
            href="/cafeteria" 
            className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
              isActive('/cafeteria') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
          >
            🍽️ Order Food
          </Link>
        )}

        {/* Messages */}
        <Link 
          href="/messages" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
            isActive('/messages') ? 'bg-blue-700' : 'hover:bg-blue-700'
          }`}
        >
          💬 Messages
        </Link>

        {/* Settings */}
        <Link 
          href="/settings" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
            isActive('/settings') ? 'bg-blue-700' : 'hover:bg-blue-700'
          }`}
        >
          ⚙️ Settings
        </Link>

        {/* Support */}
        <Link 
          href="/support" 
          className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
            isActive('/support') ? 'bg-blue-700' : 'hover:bg-blue-700'
          }`}
        >
          🆘 Support
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700 space-y-3">
        {/* User Info */}
        {user && (
          <div className="px-4 py-3 bg-blue-700 rounded-lg">
            <p className="text-xs text-blue-200">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-blue-200 truncate">{user.email}</p>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-red-600 transition text-left font-medium"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
