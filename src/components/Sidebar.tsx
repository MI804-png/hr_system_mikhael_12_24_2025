'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Award,
  Heart,
  Leaf,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'HR Management',
    icon: Users,
    submenu: [
      { label: 'Employees', href: '/employees' },
      { label: 'Attendance', href: '/attendance' },
      { label: 'Leave Management', href: '/leave' },
      { label: 'Departments', href: '/departments' },
    ],
  },
  {
    label: 'Recruitment',
    icon: Briefcase,
    submenu: [
      { label: 'Job Openings', href: '/recruitment/jobs' },
      { label: 'Applications', href: '/recruitment/applications' },
      { label: 'Candidates', href: '/recruitment/candidates' },
    ],
  },
  {
    label: 'Payroll & Benefits',
    icon: DollarSign,
    submenu: [
      { label: 'Payroll', href: '/payroll' },
      { label: 'Benefits', href: '/benefits' },
      { label: 'Compensation', href: '/compensation' },
    ],
  },
  {
    label: 'Performance',
    icon: TrendingUp,
    submenu: [
      { label: 'Reviews', href: '/performance/reviews' },
      { label: 'Goals', href: '/performance/goals' },
      { label: 'Training', href: '/training' },
    ],
  },
  {
    label: 'Strategic HR',
    icon: Award,
    submenu: [
      { label: 'Equity Management', href: '/equity' },
      { label: 'Retention', href: '/retention' },
      { label: 'Succession Planning', href: '/succession' },
    ],
  },
  {
    label: 'Compliance',
    icon: FileText,
    submenu: [
      { label: 'Policies', href: '/compliance/policies' },
      { label: 'Regulations', href: '/compliance/regulations' },
      { label: 'Audits', href: '/compliance/audits' },
    ],
  },
  {
    label: 'Corporate Social',
    icon: Leaf,
    submenu: [
      { label: 'Sustainability', href: '/sustainability' },
      { label: 'Volunteer Programs', href: '/volunteer' },
    ],
  },
];

export default function Sidebar() {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <div className="w-64 bg-gray-900 text-white shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          HRFlow
        </h1>
        <p className="text-xs text-gray-400 mt-1">HR Management System</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.submenu ? (
              <button
                onClick={() => toggleMenu(item.label)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-800 transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedMenu === item.label ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <Link
                href={item.href || '#'}
                className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-800 transition block"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )}

            {/* Submenu */}
            {item.submenu && expandedMenu === item.label && (
              <div className="bg-gray-800 py-2">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.href}
                    href={subitem.href}
                    className="px-6 py-2 pl-12 text-xs text-gray-300 hover:text-white hover:bg-gray-700 transition block"
                  >
                    {subitem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-gray-800 p-4 space-y-2">
        <Link
          href="/settings"
          className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-800 transition"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button className="w-full px-6 py-3 flex items-center space-x-3 hover:bg-red-600 transition">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
