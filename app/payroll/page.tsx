'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  code: string;
  name: string;
  position: string;
  department: string;
  email: string;
  baseSalary: number;
}

interface PayslipRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  paidDate?: string;
}

interface SalaryConfig {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  taxRate: number;
  providentFund: number;
}

export default function PayrollPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700 mb-4">Payroll management is only available to HR Admins.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'payslips' | 'salary' | 'reports'>('payslips');
  const [employees] = useState<Employee[]>([
    { id: 1, code: 'EMP-0001', name: 'John Doe', position: 'Senior Developer', department: 'Engineering', email: 'john@company.com', baseSalary: 85000 },
    { id: 2, code: 'EMP-0002', name: 'Jane Smith', position: 'Project Manager', department: 'Management', email: 'jane@company.com', baseSalary: 75000 },
    { id: 3, code: 'EMP-0003', name: 'Mike Johnson', position: 'HR Manager', department: 'Human Resources', email: 'mike@company.com', baseSalary: 65000 },
    { id: 4, code: 'EMP-0004', name: 'Sarah Davis', position: 'Full Stack Developer', department: 'Engineering', email: 'sarah@company.com', baseSalary: 78000 },
    { id: 5, code: 'EMP-0005', name: 'Tom Wilson', position: 'UI/UX Designer', department: 'Design', email: 'tom@company.com', baseSalary: 70000 },
  ]);

  const [payslips, setPayslips] = useState<PayslipRecord[]>([
    { id: 1, employeeId: 1, employeeName: 'John Doe', month: '2025-12', baseSalary: 85000, bonus: 5000, deductions: 8500, netSalary: 81500, status: 'paid', paidDate: '2025-12-01' },
    { id: 2, employeeId: 2, employeeName: 'Jane Smith', month: '2025-12', baseSalary: 75000, bonus: 4000, deductions: 7500, netSalary: 71500, status: 'paid', paidDate: '2025-12-01' },
    { id: 3, employeeId: 3, employeeName: 'Mike Johnson', month: '2025-12', baseSalary: 65000, bonus: 3000, deductions: 6500, netSalary: 61500, status: 'approved' },
    { id: 4, employeeId: 4, employeeName: 'Sarah Davis', month: '2025-12', baseSalary: 78000, bonus: 3000, deductions: 7800, netSalary: 73200, status: 'pending' },
    { id: 5, employeeId: 5, employeeName: 'Tom Wilson', month: '2025-12', baseSalary: 70000, bonus: 2500, deductions: 7000, netSalary: 65500, status: 'pending' },
    // History months
    { id: 6, employeeId: 1, employeeName: 'John Doe', month: '2025-11', baseSalary: 85000, bonus: 4500, deductions: 8500, netSalary: 81000, status: 'paid', paidDate: '2025-11-01' },
    { id: 7, employeeId: 2, employeeName: 'Jane Smith', month: '2025-11', baseSalary: 75000, bonus: 3500, deductions: 7500, netSalary: 71000, status: 'paid', paidDate: '2025-11-01' },
    { id: 8, employeeId: 3, employeeName: 'Mike Johnson', month: '2025-11', baseSalary: 65000, bonus: 2500, deductions: 6500, netSalary: 61000, status: 'paid', paidDate: '2025-11-01' },
    { id: 9, employeeId: 4, employeeName: 'Sarah Davis', month: '2025-11', baseSalary: 78000, bonus: 2800, deductions: 7800, netSalary: 73000, status: 'paid', paidDate: '2025-11-01' },
    { id: 10, employeeId: 5, employeeName: 'Tom Wilson', month: '2025-11', baseSalary: 70000, bonus: 2200, deductions: 7000, netSalary: 65200, status: 'paid', paidDate: '2025-11-01' },
    { id: 11, employeeId: 1, employeeName: 'John Doe', month: '2025-10', baseSalary: 85000, bonus: 4000, deductions: 8500, netSalary: 80500, status: 'paid', paidDate: '2025-10-01' },
    { id: 12, employeeId: 2, employeeName: 'Jane Smith', month: '2025-10', baseSalary: 75000, bonus: 3200, deductions: 7500, netSalary: 70700, status: 'paid', paidDate: '2025-10-01' },
    { id: 13, employeeId: 3, employeeName: 'Mike Johnson', month: '2025-10', baseSalary: 65000, bonus: 2300, deductions: 6500, netSalary: 60800, status: 'paid', paidDate: '2025-10-01' },
    { id: 14, employeeId: 4, employeeName: 'Sarah Davis', month: '2025-10', baseSalary: 78000, bonus: 2600, deductions: 7800, netSalary: 72800, status: 'paid', paidDate: '2025-10-01' },
    { id: 15, employeeId: 5, employeeName: 'Tom Wilson', month: '2025-10', baseSalary: 70000, bonus: 2000, deductions: 7000, netSalary: 65000, status: 'paid', paidDate: '2025-10-01' },
  ]);

  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig[]>([]);
  const [adminDeductions, setAdminDeductions] = useState<any[]>([]);

  // Load admin deductions from localStorage
  useEffect(() => {
    const loadAdminDeductions = () => {
      try {
        const saved = localStorage.getItem('adminDeductions');
        if (saved) {
          const deductions = JSON.parse(saved);
          console.log('Loaded admin deductions:', deductions);
          setAdminDeductions(deductions);
        }
      } catch (e) {
        console.error('Failed to load admin deductions:', e);
        setAdminDeductions([]);
      }
    };

    loadAdminDeductions();
  }, []);

  // Load salary configurations from localStorage and sync with payslips
  useEffect(() => {
    const loadSalaryConfig = () => {
      const saved = localStorage.getItem('salary_configurations');
      if (saved) {
        try {
          const configs = JSON.parse(saved);
          console.log('Loaded salary configurations from localStorage:', configs);
          setSalaryConfig(configs.map((config: any) => ({
            employeeId: config.id,
            employeeName: config.employeeName,
            baseSalary: config.baseSalary,
            bonus: config.bonus,
            deductions: config.baseSalary * 0.1,
            taxRate: 0.15,
            providentFund: config.baseSalary * 0.12,
          })));

          // Update payslips with new salary information
          setPayslips(prevPayslips => {
            return prevPayslips.map(payslip => {
              const newConfig = configs.find((c: any) => c.employeeName === payslip.employeeName);
              if (newConfig) {
                const newNetSalary = newConfig.baseSalary + newConfig.bonus - (newConfig.baseSalary * 0.1);
                return {
                  ...payslip,
                  baseSalary: newConfig.baseSalary,
                  bonus: newConfig.bonus,
                  deductions: newConfig.baseSalary * 0.1,
                  netSalary: newNetSalary,
                };
              }
              return payslip;
            });
          });
          return;
        } catch (e) {
          console.error('Failed to parse saved salary configurations:', e);
        }
      }

      // Fallback to default config
      const defaultConfig = employees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        baseSalary: emp.baseSalary,
        bonus: 0,
        deductions: emp.baseSalary * 0.1,
        taxRate: 0.15,
        providentFund: emp.baseSalary * 0.12,
      }));
      setSalaryConfig(defaultConfig);
    };

    loadSalaryConfig();
  }, [employees]);

  // Calculate total deductions including admin deductions
  const getTotalDeductions = (employeeName: string, month: string, baseDeductions: number): number => {
    const employeeAdminDeductions = adminDeductions.filter(
      d => d.employee_name === employeeName && 
           d.status === 'applied' && 
           d.month === parseInt(month.split('-')[1]) &&
           d.year === parseInt(month.split('-')[0])
    );
    const adminDeductionsTotal = employeeAdminDeductions.reduce((sum, d) => sum + d.amount, 0);
    return baseDeductions + adminDeductionsTotal;
  };

  // Calculate net salary with proper formula
  const calculateNetSalary = (baseSalary: number, bonus: number, totalDeductions: number): number => {
    const gross = baseSalary + bonus;
    const tax = gross * 0.15; // 15% tax rate
    const net = gross - tax - totalDeductions;
    return Math.round(net * 100) / 100;
  };

  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showHistory, setShowHistory] = useState(false);

  // Filter payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter(ps => {
      const matchesSearch = ps.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ps.status === filterStatus;
      const matchesMonth = ps.month === selectedMonth;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [payslips, searchQuery, filterStatus, selectedMonth]);

  // Calculate payroll summary
  const payrollSummary = {
    totalPayroll: filteredPayslips.reduce((sum, ps) => sum + ps.netSalary, 0),
    totalBonuses: filteredPayslips.reduce((sum, ps) => sum + ps.bonus, 0),
    totalDeductions: filteredPayslips.reduce((sum, ps) => sum + ps.deductions, 0),
    paidCount: filteredPayslips.filter(ps => ps.status === 'paid').length,
    approvedCount: filteredPayslips.filter(ps => ps.status === 'approved').length,
    pendingCount: filteredPayslips.filter(ps => ps.status === 'pending').length,
  };

  // Get available months from payslips history
  const availableMonths = useMemo(() => {
    const months = [...new Set(payslips.map(ps => ps.month))].sort().reverse();
    return months;
  }, [payslips]);

  // Get historical summary for all months
  const historicalSummary = useMemo(() => {
    return availableMonths.map(month => {
      const monthPayslips = payslips.filter(ps => ps.month === month);
      return {
        month,
        totalPayroll: monthPayslips.reduce((sum, ps) => sum + ps.netSalary, 0),
        paidCount: monthPayslips.filter(ps => ps.status === 'paid').length,
        totalEmployees: monthPayslips.length,
      };
    });
  }, [availableMonths, payslips]);

  const handleApprovePayslip = (id: number) => {
    setPayslips(payslips.map(ps => ps.id === id ? { ...ps, status: 'approved' } : ps));
  };

  const handlePayPayslip = (id: number) => {
    setPayslips(payslips.map(ps => ps.id === id ? { ...ps, status: 'paid', paidDate: new Date().toISOString().split('T')[0] } : ps));
  };

  const handleUpdateSalary = (employeeId: number, field: string, value: number) => {
    setSalaryConfig(salaryConfig.map(sc =>
      sc.employeeId === employeeId
        ? { ...sc, [field]: value }
        : sc
    ));
  };

  const handleGeneratePayslips = () => {
    const newPayslips: PayslipRecord[] = salaryConfig.map((config, index) => {
      const grossSalary = config.baseSalary + config.bonus;
      const taxes = grossSalary * config.taxRate;
      const totalDeductions = config.deductions + taxes + config.providentFund;
      const netSalary = grossSalary - totalDeductions;

      return {
        id: payslips.length + index + 1,
        employeeId: config.employeeId,
        employeeName: config.employeeName,
        month: selectedMonth,
        baseSalary: config.baseSalary,
        bonus: config.bonus,
        deductions: totalDeductions,
        netSalary: Math.round(netSalary),
        status: 'pending',
      };
    });

    setPayslips([...payslips.filter(ps => ps.month !== selectedMonth), ...newPayslips]);
    alert(`✓ Generated ${newPayslips.length} payslips for ${selectedMonth}`);
  };

  const handleApproveAllPending = () => {
    const pendingCount = payslips.filter(ps => ps.status === 'pending').length;
    if (pendingCount === 0) {
      alert('ℹ️ No pending payslips to approve');
      return;
    }
    setPayslips(payslips.map(ps => ps.status === 'pending' ? { ...ps, status: 'approved' } : ps));
    alert(`✓ Approved ${pendingCount} pending payslips`);
  };

  const handleProcessPayments = () => {
    const approvedCount = payslips.filter(ps => ps.status === 'approved').length;
    if (approvedCount === 0) {
      alert('ℹ️ No approved payslips to process');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setPayslips(payslips.map(ps => ps.status === 'approved' ? { ...ps, status: 'paid', paidDate: today } : ps));
    alert(`✓ Processed ${approvedCount} payments successfully`);
  };

  const handleGeneratePDF = () => {
    if (filteredPayslips.length === 0) {
      alert('ℹ️ No payslips to generate PDF');
      return;
    }
    // Simulate PDF generation
    const pdfContent = filteredPayslips.map(ps => 
      `${ps.employeeName} - ${ps.month}: ₹${ps.netSalary}`
    ).join('\n');
    
    const element = document.createElement('a');
    const file = new Blob([pdfContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `payslips_${selectedMonth}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert(`✓ Generated payslips PDF for ${selectedMonth}`);
  };

  const handleExportExcel = () => {
    if (filteredPayslips.length === 0) {
      alert('ℹ️ No payslips to export');
      return;
    }
    
    // Create CSV content
    const headers = ['Employee Name', 'Month', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Status'];
    const rows = filteredPayslips.map(ps => [
      ps.employeeName,
      ps.month,
      ps.baseSalary,
      ps.bonus,
      ps.deductions,
      ps.netSalary,
      ps.status
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const element = document.createElement('a');
    const file = new Blob([csv], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = `payslips_${selectedMonth}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert(`✓ Exported ${filteredPayslips.length} payslips to Excel`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">💰 Payroll Management</h1>
        <p className="text-gray-600 mt-2">Manage employee salaries, payslips, and deductions</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('payslips')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'payslips'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Payslips
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'salary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          💵 Salary Configuration
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Reports
        </button>
        <button
          onClick={() => {
            setActiveTab('payslips');
            setShowHistory(!showHistory);
          }}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            showHistory
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 History
        </button>
      </div>

      {/* PAYSLIPS TAB */}
      {activeTab === 'payslips' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Payroll</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{payrollSummary.totalPayroll.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">For {selectedMonth}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Bonuses</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{payrollSummary.totalBonuses.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{filteredPayslips.length} employees</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Deductions</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{payrollSummary.totalDeductions.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Taxes & Benefits</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Paid</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{payrollSummary.paidCount}</p>
              <p className="text-xs text-gray-500 mt-2">Processed</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{payrollSummary.pendingCount}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting action</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
                <input
                  type="text"
                  placeholder="🔍 Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGeneratePayslips}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
              >
                ⚡ Generate Payslips
              </button>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Base Salary</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Bonus</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Deductions</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Net Salary</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayslips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No payslips found
                      </td>
                    </tr>
                  ) : (
                    filteredPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{payslip.employeeName}</p>
                          <p className="text-sm text-gray-500">{payslip.month}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">₹{payslip.baseSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">₹{payslip.bonus.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm text-red-600">₹{payslip.deductions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">₹{payslip.netSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payslip.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payslip.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payslip.status === 'pending' && (
                            <button
                              onClick={() => handleApprovePayslip(payslip.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                              Approve
                            </button>
                          )}
                          {payslip.status === 'approved' && (
                            <button
                              onClick={() => handlePayPayslip(payslip.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            >
                              Pay Now
                            </button>
                          )}
                          {payslip.status === 'paid' && (
                            <span className="text-xs text-gray-500">Paid {payslip.paidDate}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {showHistory && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">📅 Payroll History</h2>
            <p className="opacity-90">View and analyze payroll data from previous months</p>
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {historicalSummary.map((item) => (
              <div key={item.month} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => setSelectedMonth(item.month)}>
                <p className="text-gray-600 text-sm font-medium">Month: {item.month}</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">₹{item.totalPayroll.toLocaleString()}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-600">Employees: <span className="font-semibold text-gray-900">{item.totalEmployees}</span></p>
                  <p className="text-green-600">Paid: <span className="font-semibold">{item.paidCount}/{item.totalEmployees}</span></p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed History Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Base Salary</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Bonus</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Deductions</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Net Salary</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payslips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No history records found
                      </td>
                    </tr>
                  ) : (
                    payslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-semibold text-purple-600">{payslip.month}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{payslip.employeeName}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">₹{payslip.baseSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">₹{payslip.bonus.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm text-red-600">₹{payslip.deductions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">₹{payslip.netSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payslip.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payslip.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payslip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {payslip.paidDate ? payslip.paidDate : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* History Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Payroll (All Months)</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">₹{payslips.reduce((sum, ps) => sum + ps.netSalary, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{payslips.length} payslips</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Bonuses Paid</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{payslips.reduce((sum, ps) => sum + ps.bonus, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Average: ₹{Math.round(payslips.reduce((sum, ps) => sum + ps.bonus, 0) / payslips.length).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Deductions</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{payslips.reduce((sum, ps) => sum + ps.deductions, 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Taxes & Benefits</p>
            </div>
          </div>
        </div>
      )}

      {/* SALARY CONFIGURATION TAB */}
      {activeTab === 'salary' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Base Salary</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Bonus</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Deductions</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tax Rate (%)</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Provident Fund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salaryConfig.map((config) => (
                  <tr key={config.employeeId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{config.employeeName}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={config.baseSalary}
                        onChange={(e) => handleUpdateSalary(config.employeeId, 'baseSalary', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={config.bonus}
                        onChange={(e) => handleUpdateSalary(config.employeeId, 'bonus', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={config.deductions}
                        onChange={(e) => handleUpdateSalary(config.employeeId, 'deductions', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={config.taxRate * 100}
                        onChange={(e) => handleUpdateSalary(config.employeeId, 'taxRate', parseFloat(e.target.value) / 100)}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={config.providentFund}
                        onChange={(e) => handleUpdateSalary(config.employeeId, 'providentFund', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => alert('✓ Salary configurations updated')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              💾 Save Changes
            </button>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Salary Cost:</span>
                <span className="font-semibold text-gray-900">₹{(payrollSummary.totalPayroll + payrollSummary.totalDeductions).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Net Payroll:</span>
                <span className="font-semibold text-green-600">₹{payrollSummary.totalPayroll.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Total Deductions:</span>
                <span className="font-semibold text-red-600">₹{payrollSummary.totalDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Average Salary:</span>
                <span className="font-semibold text-gray-900">₹{Math.round(payrollSummary.totalPayroll / filteredPayslips.length || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Status Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-gray-700">Paid</span>
                </div>
                <span className="font-semibold text-gray-900">{payrollSummary.paidCount} employees</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-gray-700">Approved</span>
                </div>
                <span className="font-semibold text-gray-900">{payrollSummary.approvedCount} employees</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                  <span className="text-gray-700">Pending</span>
                </div>
                <span className="font-semibold text-gray-900">{payrollSummary.pendingCount} employees</span>
              </div>
            </div>

            <button 
              onClick={handleExportExcel}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              📥 Download Report
            </button>
          </div>

          {/* Tax Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deduction Breakdown</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">Taxes & Levies</p>
              <div className="bg-gray-100 rounded px-3 py-2">
                <span className="text-gray-600">Estimated total:</span>
                <span className="float-right font-semibold">₹{Math.round(payrollSummary.totalDeductions * 0.5).toLocaleString()}</span>
              </div>
              <p className="text-gray-700 mt-4">Benefits & Fund</p>
              <div className="bg-gray-100 rounded px-3 py-2">
                <span className="text-gray-600">Provident Fund:</span>
                <span className="float-right font-semibold">₹{Math.round(payrollSummary.totalDeductions * 0.5).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleApproveAllPending}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-sm"
              >
                ✓ Approve All Pending
              </button>
              <button 
                onClick={handleProcessPayments}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
              >
                💳 Process Payments
              </button>
              <button 
                onClick={handleGeneratePDF}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium text-sm"
              >
                📄 Generate Payslips PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium text-sm"
              >
                📊 Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
