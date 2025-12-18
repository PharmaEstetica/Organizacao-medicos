// client/src/lib/orderGrouping.ts
import { ParsedOrder, GroupedOrder } from '../types';

function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function unificarSequenciais(orders: ParsedOrder[]): GroupedOrder[] {
  if (orders.length === 0) return [];

  // Ordenar por: Data, Paciente, Status
  const sorted = [...orders].sort((a, b) => {
    const dateCompare = a.orderDate.getTime() - b.orderDate.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    const patientA = a.patient || '';
    const patientB = b.patient || '';
    const patientCompare = patientA.localeCompare(patientB);
    if (patientCompare !== 0) return patientCompare;
    
    return a.status.localeCompare(b.status);
  });

  const grouped: GroupedOrder[] = [];
  let current: GroupedOrder | null = null;

  for (const order of sorted) {
    const shouldUnify =
      current &&
      current.patient === (order.patient || undefined) &&
      current.status === order.status &&
      isSameDate(current.orderDate, order.orderDate);

    if (shouldUnify && current) {
      // Unificar: somar valores e concatenar números
      current.orderNumbers.push(order.orderNumber);
      current.netValue += order.netValue;
    } else {
      // Novo grupo
      if (current) grouped.push(current);
      current = {
        prescriberName: order.prescriberName,
        orderNumbers: [order.orderNumber],
        orderDate: order.orderDate,
        status: order.status as 'Efetivado' | 'Não efetivado',
        netValue: order.netValue,
        patient: order.patient,
      };
    }
  }

  if (current) grouped.push(current);
  return grouped;
}
