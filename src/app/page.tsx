'use client';

export default function Dashboard() {
  const stats = {
    totalEmployees: 245,
    openPositions: 12,
    revenue: 2450000,
    alerts: 3,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your HR management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
          <p className="text-blue-600 text-xs font-medium mt-2">+2.5% from last month</p>
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Open Positions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openPositions}</p>
          <p className="text-green-600 text-xs font-medium mt-2">Active postings</p>
        </div>

        {/* Annual Revenue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Annual Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${(stats.revenue / 1000000).toFixed(1)}M</p>
          <p className="text-purple-600 text-xs font-medium mt-2">+5.3% growth</p>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Pending Actions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.alerts}</p>
          <p className="text-red-600 text-xs font-medium mt-2">Review needed</p>
        </div>
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
