// types/index.ts

export interface Prescriber {
  id: number;
  name: string;
  specialty: string;
  crm: string | null;
  crm_required: boolean;
  commission_percentage: number;
  bond_type: 'P' | 'C' | 'N';
  created_at: string;
  updated_at: string;
  // New fields for profile simulation
  photo_url?: string;
  formulas_count?: number;
  packagings_count?: number;
}

export interface ParsedOrder {
  prescriberName: string;
  orderNumber: string;
  orderDate: Date;
  status: string;
  netValue: number;
  patient?: string;
}

export interface GroupedOrder {
  prescriberName: string;
  orderNumbers: string[];
  orderDate: Date;
  status: 'Efetivado' | 'Não efetivado';
  netValue: number;
  patient?: string;
  // New fields for manual entry
  req?: string;
  discountPercentage?: number;
  paymentStatus?: 'Pago' | 'Pendente';
}

export interface Report {
  id: number;
  prescriber_id: number;
  reference_month: string;
  total_orders: number;
  effective_orders: number;
  conversion_rate: number;
  total_effective_value: number;
  commission_value: number;
  expenses: number;
  final_balance: number;
  pdf_path: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  report_id: number;
  prescriber_id: number;
  order_numbers: string;
  order_date: string;
  status: string;
  net_value: number;
  patient: string | null;
  payment_status: 'pending' | 'paid';
  created_at: string;
}
