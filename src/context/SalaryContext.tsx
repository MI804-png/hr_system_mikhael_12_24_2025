'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface SalaryConfig {
  id: number;
  employee_id: number;
  employee_name: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  tax_rate: number;
  net_salary: number;
  effective_date: string;
}

export interface Payslip {
  id: number;
  employee_id: number;
  employee_name: string;
  month: number;
  year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
  net_salary: number;
  status: 'draft' | 'approved' | 'paid';
  created_at: string;
}

export interface SalaryHistory {
  id: number;
  employee_id: number;
  employee_name: string;
  change_type: 'increase' | 'decrease' | 'adjustment';
  old_salary: number;
  new_salary: number;
  reason: string;
  effective_date: string;
  created_by: string;
  created_at: string;
}

interface SalaryContextType {
  salaryConfigs: SalaryConfig[];
  payslips: Payslip[];
  salaryHistory: SalaryHistory[];
  loading: boolean;
  error: string | null;
  updateSalaryConfig: (config: SalaryConfig) => void;
  createPayslip: (payslip: Payslip) => void;
  addSalaryHistory: (history: SalaryHistory) => void;
  getSalaryConfigByEmployee: (employeeId: number) => SalaryConfig | undefined;
  getPayslipsForEmployee: (employeeId: number) => Payslip[];
  calculateNetSalary: (baseSalary: number, allowances: number, deductions: number, taxRate: number) => number;
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

export function SalaryProvider({ children }: { children: ReactNode }) {
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load salary data from localStorage on mount
  useEffect(() => {
    const loadSalaryData = () => {
      try {
        const savedConfigs = localStorage.getItem('salaryConfigs');
        const savedPayslips = localStorage.getItem('payslips');
        const savedHistory = localStorage.getItem('salaryHistory');

        if (savedConfigs) setSalaryConfigs(JSON.parse(savedConfigs));
        if (savedPayslips) setPayslips(JSON.parse(savedPayslips));
        if (savedHistory) setSalaryHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Error loading salary data from localStorage:', err);
      }
    };

    loadSalaryData();
  }, []);

  // Save salary configs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('salaryConfigs', JSON.stringify(salaryConfigs));
  }, [salaryConfigs]);

  // Save payslips to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('payslips', JSON.stringify(payslips));
  }, [payslips]);

  // Save salary history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salaryHistory', JSON.stringify(salaryHistory));
  }, [salaryHistory]);

  const calculateNetSalary = (baseSalary: number, allowances: number, deductions: number, taxRate: number): number => {
    const gross = baseSalary + allowances;
    const tax = gross * (taxRate / 100);
    const net = gross - tax - deductions;
    return Math.round(net * 100) / 100;
  };

  const updateSalaryConfig = (config: SalaryConfig) => {
    setSalaryConfigs((prev) => {
      const existing = prev.find(c => c.id === config.id || c.employee_id === config.employee_id);
      if (existing) {
        return prev.map(c => (c.id === config.id || c.employee_id === config.employee_id ? config : c));
      }
      return [...prev, { ...config, id: prev.length + 1 }];
    });
    setError(null);
  };

  const createPayslip = (payslip: Payslip) => {
    setPayslips((prev) => [...prev, { ...payslip, id: prev.length + 1, created_at: new Date().toISOString() }]);
    setError(null);
  };

  const addSalaryHistory = (history: SalaryHistory) => {
    setSalaryHistory((prev) => [...prev, { ...history, id: prev.length + 1, created_at: new Date().toISOString() }]);
    setError(null);
  };

  const getSalaryConfigByEmployee = (employeeId: number): SalaryConfig | undefined => {
    return salaryConfigs.find(c => c.employee_id === employeeId);
  };

  const getPayslipsForEmployee = (employeeId: number): Payslip[] => {
    return payslips.filter(p => p.employee_id === employeeId);
  };

  const value: SalaryContextType = {
    salaryConfigs,
    payslips,
    salaryHistory,
    loading,
    error,
    updateSalaryConfig,
    createPayslip,
    addSalaryHistory,
    getSalaryConfigByEmployee,
    getPayslipsForEmployee,
    calculateNetSalary,
  };

  return (
    <SalaryContext.Provider value={value}>
      {children}
    </SalaryContext.Provider>
  );
}

export function useSalary() {
  const context = useContext(SalaryContext);
  if (!context) {
    throw new Error('useSalary must be used within a SalaryProvider');
  }
  return context;
}
