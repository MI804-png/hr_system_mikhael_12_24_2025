import { ReactNode } from 'react';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
};

export default function DashboardCard({
  icon,
  title,
  value,
  trend,
  color,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className={`text-sm mt-2 ${color === 'red' ? 'text-red-600' : 'text-green-600'}`}>
        {trend}
      </p>
    </div>
  );
}
