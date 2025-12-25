'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Order {
  id: number;
  employeeName: string;
  employeeEmail: string;
  items: { menuItemId: number; itemName: string; quantity: number }[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'picked-up' | 'cancelled';
  orderDate: string;
  pickupTime?: string;
  notes?: string;
}

interface DataContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: number, updates: Partial<Order>) => void;
  deleteOrder: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial demo orders
const initialOrders: Order[] = [
  { id: 1, employeeName: 'John Doe', employeeEmail: 'john@company.com', items: [{ menuItemId: 1, itemName: 'Biryani', quantity: 2 }], totalPrice: 300, status: 'ready', orderDate: '2025-12-25', pickupTime: '12:30 PM' },
  { id: 2, employeeName: 'Jane Smith', employeeEmail: 'jane@company.com', items: [{ menuItemId: 3, itemName: 'Paneer Tikka', quantity: 1 }, { menuItemId: 6, itemName: 'Naan', quantity: 2 }], totalPrice: 200, status: 'preparing', orderDate: '2025-12-25' },
  { id: 3, employeeName: 'Mike Johnson', employeeEmail: 'mike@company.com', items: [{ menuItemId: 2, itemName: 'Butter Chicken', quantity: 1 }], totalPrice: 180, status: 'pending', orderDate: '2025-12-25', pickupTime: '1:00 PM' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrder = (id: number, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, ...updates } : order));
  };

  const deleteOrder = (id: number) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  return (
    <DataContext.Provider value={{ orders, setOrders, addOrder, updateOrder, deleteOrder }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
