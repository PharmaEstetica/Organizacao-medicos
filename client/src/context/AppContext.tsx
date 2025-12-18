import React, { createContext, useContext, useState, useEffect } from 'react';
import { Prescriber, GroupedOrder, Report, Formula, Packaging } from '../types';

interface AppContextType {
  prescribers: Prescriber[];
  orders: GroupedOrder[];
  reports: Report[];
  formulas: Formula[];
  packagings: Packaging[];
  pharmaceuticalForms: string[];
  addPrescriber: (prescriber: Omit<Prescriber, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePrescriber: (id: number, prescriber: Partial<Prescriber>) => void;
  deletePrescriber: (id: number) => void;
  addOrders: (newOrders: GroupedOrder[]) => void;
  clearOrders: () => void;
  generateReport: (prescriberId: number, month: string, data: any) => void;
  addFormula: (formula: Omit<Formula, 'id' | 'createdAt'>) => void;
  updateFormula: (id: number, formula: Partial<Formula>) => void;
  deleteFormula: (id: number) => void;
  addPackaging: (packaging: Omit<Packaging, 'id' | 'createdAt'>) => void;
  deletePackaging: (id: number) => void;
  addPharmaceuticalForm: (form: string) => void;
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
      packagings_count: 5,
      linked_packagings: [1]
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
      packagings_count: 3,
      linked_packagings: []
    }
  ]);

  const [orders, setOrders] = useState<GroupedOrder[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Formulas State
  const [formulas, setFormulas] = useState<Formula[]>([
    {
      id: 1,
      name: 'Anti-Aging Basic',
      prescriberId: 1,
      content: 'Ácido Hialurônico 1% + Vitamina C 10%',
      pharmaceuticalForm: 'Creme',
      packagingId: 1,
      createdAt: new Date().toISOString()
    }
  ]);

  const [packagings, setPackagings] = useState<Packaging[]>([
    { id: 1, name: 'Pote Luxo Branco', type: 'Pote', capacity: '30g', createdAt: new Date().toISOString() },
    { id: 2, name: 'Bisnaga Pump', type: 'Bisnaga', capacity: '50g', createdAt: new Date().toISOString() },
  ]);

  // Unique Pharmaceutical Forms list
  const [pharmaceuticalForms, setPharmaceuticalForms] = useState<string[]>([
    'Creme', 'Gel', 'Cápsula', 'Loção', 'Xarope', 'Sérum'
  ]);

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

  const addFormula = (data: Omit<Formula, 'id' | 'createdAt'>) => {
    const newFormula: Formula = {
      ...data,
      id: Math.max(0, ...formulas.map(f => f.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    setFormulas([...formulas, newFormula]);
  };

  const updateFormula = (id: number, data: Partial<Formula>) => {
    setFormulas(formulas.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const deleteFormula = (id: number) => {
    setFormulas(formulas.filter(f => f.id !== id));
  };

  const addPackaging = (data: Omit<Packaging, 'id' | 'createdAt'>) => {
    const newPkg: Packaging = {
        ...data,
        id: Math.max(0, ...packagings.map(p => p.id)) + 1,
        createdAt: new Date().toISOString()
    };
    setPackagings([...packagings, newPkg]);
  };

  const deletePackaging = (id: number) => {
    setPackagings(packagings.filter(p => p.id !== id));
  };

  const addPharmaceuticalForm = (form: string) => {
    if (!pharmaceuticalForms.includes(form)) {
      setPharmaceuticalForms([...pharmaceuticalForms, form]);
    }
  };

  return (
    <AppContext.Provider value={{ 
      prescribers, 
      orders, 
      reports, 
      formulas,
      packagings,
      pharmaceuticalForms,
      addPrescriber, 
      updatePrescriber, 
      deletePrescriber,
      addOrders,
      clearOrders,
      generateReport,
      addFormula,
      updateFormula,
      deleteFormula,
      addPackaging,
      deletePackaging,
      addPharmaceuticalForm
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
