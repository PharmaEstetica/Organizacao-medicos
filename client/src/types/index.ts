// types/index.ts

export interface Prescriber {
  id: number;
  name: string;
  specialty: string;
  crm: string | null;
  crmRequired: boolean;
  commissionPercentage: number;
  bondType: 'P' | 'C' | 'N';
  createdAt: string;
  updatedAt: string;
  // New fields for profile simulation
  photoUrl?: string;
  formulasCount?: number;
  packagingsCount?: number;
  linkedPackagings?: number[];
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
  prescriberId: number;
  referenceMonth: string;
  totalOrders: number;
  effectiveOrders: number;
  conversionRate: number;
  totalEffectiveValue: number;
  commissionValue: number;
  expenses: number;
  finalBalance: number;
  pdfPath: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  reportId: number;
  prescriberId: number;
  orderNumbers: string;
  orderDate: string;
  status: string;
  netValue: number;
  patient: string | null;
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

export interface Formula {
  id: number;
  name: string;
  prescriberId: number | null; // null means "Nenhum"
  content: string;
  pharmaceuticalForm: string;
  packagingId?: number; // Linked packaging
  createdAt: string;
}

export interface Packaging {
  id: number;
  name: string; // e.g., "Pote Branco"
  type: string; // e.g., "Pote", "Bisnaga"
  capacity: string; // e.g., "30g", "50ml"
  imageUrl?: string;
  hasSticker: boolean;
  stickerSupplier?: string;
  createdAt: string;
}
