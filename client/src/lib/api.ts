const API_BASE = "/api";

export interface Prescriber {
  id: number;
  name: string;
  specialty: string;
  crm: string | null;
  crmRequired: boolean;
  commissionPercentage: string;
  bondType: string;
  photoUrl?: string | null;
  linkedPackagings: number[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Packaging {
  id: number;
  name: string;
  type: string;
  capacity: string;
  imageUrl?: string | null;
  hasSticker: boolean;
  stickerSupplier?: string | null;
  createdAt: string;
}

export interface Formula {
  id: number;
  name: string;
  prescriberId: number | null;
  packagingId: number | null;
  content: string;
  pharmaceuticalForm: string;
  createdAt: string;
}

export interface Order {
  id: number;
  prescriberId: number | null;
  prescriberName?: string | null;
  orderNumbers: string;
  orderDate: string;
  status: string;
  netValue: string;
  patient?: string | null;
  req?: string | null;
  discountPercentage?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
}

export interface Report {
  id: number;
  prescriberId: number;
  referenceMonth: string;
  totalOrders: number;
  effectiveOrders: number;
  conversionRate: string;
  totalEffectiveValue: string;
  commissionValue: string;
  expenses: string;
  finalBalance: string;
  pdfPath?: string | null;
  createdAt: string;
}

export interface PharmaceuticalForm {
  id: number;
  name: string;
  createdAt: string;
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  prescribers: {
    getAll: () => apiRequest<Prescriber[]>("/prescribers"),
    getOne: (id: number) => apiRequest<Prescriber>(`/prescribers/${id}`),
    create: (data: Partial<Prescriber>) =>
      apiRequest<Prescriber>("/prescribers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Prescriber>) =>
      apiRequest<Prescriber>(`/prescribers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/prescribers/${id}`, { method: "DELETE" }),
  },

  packagings: {
    getAll: () => apiRequest<Packaging[]>("/packagings"),
    create: (data: Partial<Packaging>) =>
      apiRequest<Packaging>("/packagings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/packagings/${id}`, { method: "DELETE" }),
  },

  formulas: {
    getAll: () => apiRequest<Formula[]>("/formulas"),
    create: (data: Partial<Formula>) =>
      apiRequest<Formula>("/formulas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Formula>) =>
      apiRequest<Formula>(`/formulas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/formulas/${id}`, { method: "DELETE" }),
  },

  orders: {
    getAll: () => apiRequest<Order[]>("/orders"),
    create: (data: Partial<Order>) =>
      apiRequest<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/orders/${id}`, { method: "DELETE" }),
  },

  reports: {
    getAll: () => apiRequest<Report[]>("/reports"),
    create: (data: Partial<Report>) =>
      apiRequest<Report>("/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/reports/${id}`, { method: "DELETE" }),
  },

  pharmaceuticalForms: {
    getAll: () => apiRequest<PharmaceuticalForm[]>("/pharmaceutical-forms"),
    create: (name: string) =>
      apiRequest<PharmaceuticalForm>("/pharmaceutical-forms", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
  },
};
