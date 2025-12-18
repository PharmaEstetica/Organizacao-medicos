import React, { createContext, useContext, useState, useEffect } from 'react';
import { Prescriber, GroupedOrder, Report } from '../types';

interface AppContextType {
  prescribers: Prescriber[];
  orders: GroupedOrder[];
  reports: Report[];
  addPrescriber: (prescriber: Omit<Prescriber, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePrescriber: (id: number, prescriber: Partial<Prescriber>) => void;
  deletePrescriber: (id: number) => void;
  addOrders: (newOrders: GroupedOrder[]) => void;
  clearOrders: () => void;
  generateReport: (prescriberId: number, month: string, data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Mock Data
  const [prescribers, setPrescribers] = useState<Prescriber[]>([
    {
      id: 1,
      name: 'Dr. Silva',
      specialty: 'Dermatologia',
      crm: '12345',
      crm_required: true,
      commission_percentage: 10,
      bond_type: 'P',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&auto=format&fit=crop&q=60',
      formulas_count: 12,
      packagings_count: 5
    },
    {
      id: 2,
      name: 'Dra. Souza',
      specialty: 'Nutrologia',
      crm: '67890',
      crm_required: true,
      commission_percentage: 15,
      bond_type: 'C',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&auto=format&fit=crop&q=60',
      formulas_count: 8,
      packagings_count: 3
    }
  ]);

  const [orders, setOrders] = useState<GroupedOrder[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const addPrescriber = (data: Omit<Prescriber, 'id' | 'created_at' | 'updated_at'>) => {
    const newPrescriber: Prescriber = {
      ...data,
      id: Math.max(0, ...prescribers.map(p => p.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      formulas_count: 0,
      packagings_count: 0
    };
    setPrescribers([...prescribers, newPrescriber]);
  };

  const updatePrescriber = (id: number, data: Partial<Prescriber>) => {
    setPrescribers(prescribers.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p));
  };

  const deletePrescriber = (id: number) => {
    setPrescribers(prescribers.filter(p => p.id !== id));
  };

  const addOrders = (newOrders: GroupedOrder[]) => {
    setOrders([...orders, ...newOrders]);
  };

  const clearOrders = () => {
    setOrders([]);
  };

  const generateReport = (prescriberId: number, month: string, data: any) => {
    // Mock report generation
    const newReport: Report = {
      id: Math.max(0, ...reports.map(r => r.id)) + 1,
      prescriber_id: prescriberId,
      reference_month: month,
      ...data,
      created_at: new Date().toISOString(),
    };
    setReports([...reports, newReport]);
  };

  return (
    <AppContext.Provider value={{ 
      prescribers, 
      orders, 
      reports, 
      addPrescriber, 
      updatePrescriber, 
      deletePrescriber,
      addOrders,
      clearOrders,
      generateReport
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
