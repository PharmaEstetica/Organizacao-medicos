import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/useApi";
import type { Order } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, FileText } from "lucide-react";

interface MonthlyOrdersProps {
  filterMonth?: string;
}

export function MonthlyOrders({ filterMonth = 'all' }: MonthlyOrdersProps) {
  const { data: orders = [] } = useOrders();

  const filteredOrders = orders.filter(order => {
    if (filterMonth === 'all') return true;
    const date = new Date(order.orderDate);
    const monthStr = `${date.getMonth() + 1}/${date.getFullYear()}`;
    return monthStr === filterMonth;
  });

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const totalValue = filteredOrders.reduce((acc, order) => {
    const netValue = typeof order.netValue === 'string' ? parseFloat(order.netValue) : order.netValue;
    return acc + netValue;
  }, 0);

  return (
    <Card className="border border-border rounded-sm bg-card shadow-sm">
      <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Tabela de Pedidos
            </CardTitle>
          </div>
          <div className="text-right flex items-center gap-3 bg-background border border-border px-3 py-1.5 rounded-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground">Data</TableHead>
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground">Parceiro</TableHead>
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground">REQ / Pedidos</TableHead>
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground">Pagamento</TableHead>
              <TableHead className="h-10 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Valor Líquido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, index) => (
                <TableRow key={`${order.prescriberName}-${index}`} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="text-muted-foreground py-3 text-sm">
                    {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground text-sm">{order.prescriberName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {order.req ? <span className="text-primary font-bold">#{order.req}</span> : order.orderNumbers.join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`rounded-sm border font-medium px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                        order.status === 'Efetivado' 
                        ? "border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
                        : "border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-900"
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.paymentStatus && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-sm ${
                        order.paymentStatus === 'Pago' 
                        ? 'text-green-600 bg-green-100/50' 
                        : 'text-amber-600 bg-amber-100/50'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground text-sm font-mono">
                    {formatCurrency(order.netValue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
