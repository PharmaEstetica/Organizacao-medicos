// client/src/lib/csvParser.ts
import { z } from 'zod';
import { ParsedOrder } from '../types';

const REQUIRED_HEADERS = ['Nome', 'Número', 'Data', 'Status', 'Valor Líquido', 'Paciente'];

const OrderRowSchema = z.object({
  Nome: z.string().min(1),
  Número: z.string().min(1),
  Data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  Status: z.string().min(1),
  'Valor Líquido': z.string(),
  Paciente: z.string().optional(),
});

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function parseCurrency(value: string): number {
  // "R$ 1.234,56" → 1234.56
  const cleaned = value
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function normalizeStatus(status: string): 'Efetivado' | 'Não efetivado' {
  const lower = status.toLowerCase().trim();
  if (lower === 'aprovado' || lower === 'efetivado') {
    return 'Efetivado';
  }
  return 'Não efetivado';
}

function getOriginalStatus(status: string): string {
  const trimmed = status.trim();
  if (trimmed.toLowerCase() === 'aprovado') return 'Aprovado';
  if (trimmed.toLowerCase() === 'recusado') return 'Recusado';
  if (trimmed.toLowerCase() === 'no carrinho') return 'No carrinho';
  return trimmed;
}

export function parseCSV(content: string): { data: ParsedOrder[]; errors: string[] } {
  const errors: string[] = [];
  
  // Handle BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.trim().split('\n');
  
  if (lines.length < 2) {
    return { data: [], errors: ['Arquivo CSV vazio ou sem dados'] };
  }

  const headers = lines[0].split(';').map(h => h.trim());
  
  // Validate required headers exist
  const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { 
      data: [], 
      errors: [`Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(', ')}`] 
    };
  }

  const data: ParsedOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const validation = OrderRowSchema.safeParse(row);
    
    if (!validation.success) {
      errors.push(`Linha ${i + 1}: ${validation.error.errors[0].message}`);
      continue;
    }

    const originalStatus = getOriginalStatus(row['Status']);
    
    data.push({
      prescriberName: row['Nome'],
      orderNumber: row['Número'],
      orderDate: parseDate(row['Data']),
      status: normalizeStatus(row['Status']),
      netValue: parseCurrency(row['Valor Líquido']),
      patient: row['Paciente'] || undefined,
      originalStatus: originalStatus,
    });
  }

  return { data, errors };
}
