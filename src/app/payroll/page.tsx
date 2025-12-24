'use client';

import { useState } from 'react';
import { DollarSign, Download, Plus, Filter } from 'lucide-react';

interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  month: string;
  status: 'paid' | 'pending' | 'processing';
}

export default function Payroll() {
  const [payrollRecords] = useState<PayrollRecord[]>([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      baseSalary: 75000,
      bonus: 5000,
      deductions: 12000,
      netPay: 68000,
      month: 'December 2024',
      status: 'paid',
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Jane Smith',
      baseSalary: 65000,
      bonus: 3000,
      deductions: 10000,
      netPay: 58000,
      month: 'December 2024',
      status: 'paid',
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Mike Johnson',
      baseSalary: 70000,
      bonus: 4000,
      deductions: 11000,
      netPay: 63000,
      month: 'December 2024',
      status: 'pending',
    },
  ]);

  const getStatusColor = (status: PayrollRecord['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const totalNetPay = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-2">Process and manage employee salaries and payments</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-5 h-5" />
          <span>New Payroll</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Net Pay</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalNetPay.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Payroll Status</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{payrollRecords.filter(r => r.status === 'pending').length} Pending</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Employees Processed</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{payrollRecords.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>December 2024</option>
          <option>November 2024</option>
          <option>October 2024</option>
        </select>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Filter className="w-5 h-5" />
          <span>Filter</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Download className="w-5 h-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Base Salary</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bonus</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Deductions</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Net Pay</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payrollRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.employeeName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">${record.baseSalary.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">${record.bonus.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">${record.deductions.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${record.netPay.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-900 font-medium">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
