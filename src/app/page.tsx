'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import { Users, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    openPositions: 0,
    revenue: 0,
    alerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from backend
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // This would connect to your Django backend
      setStats({
        totalEmployees: 245,
        openPositions: 12,
        revenue: 2450000,
        alerts: 3,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your HR management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<Users className="w-8 h-8" />}
          title="Total Employees"
          value={stats.totalEmployees}
          trend="+2.5%"
          color="blue"
        />
        <DashboardCard
          icon={<Briefcase className="w-8 h-8" />}
          title="Open Positions"
          value={stats.openPositions}
          trend="-1.2%"
          color="green"
        />
        <DashboardCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Annual Revenue"
          value={`$${(stats.revenue / 1000000).toFixed(1)}M`}
          trend="+5.3%"
          color="purple"
        />
        <DashboardCard
          icon={<AlertCircle className="w-8 h-8" />}
          title="Pending Actions"
          value={stats.alerts}
          trend="Review needed"
          color="red"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { name: 'John Doe', action: 'Approved new employee onboarding', time: '2 hours ago' },
              { name: 'Jane Smith', action: 'Updated compensation package', time: '4 hours ago' },
              { name: 'Mike Johnson', action: 'Submitted compliance report', time: '1 day ago' },
            ].map((activity, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50 transition">
                <p className="font-medium text-gray-900">{activity.name}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Add Employee
            </button>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
              New Job Opening
            </button>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
              Review Performance
            </button>
            <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
