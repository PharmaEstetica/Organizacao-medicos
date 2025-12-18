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
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, FileText } from "lucide-react";

interface MonthlyOrdersProps {
  filterMonth?: string;
}

export function MonthlyOrders({ filterMonth = 'all' }: MonthlyOrdersProps) {
  const { orders } = useApp();

  const filteredOrders = orders.filter(order => {
    if (filterMonth === 'all') return true;
    const date = new Date(order.orderDate);
    const monthStr = `${date.getMonth() + 1}/${date.getFullYear()}`;
    return monthStr === filterMonth;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalValue = filteredOrders.reduce((acc, order) => acc + order.netValue, 0);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex justify-between items-end">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Pedidos de Parceiros
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filterMonth === 'all' ? 'Todos os pedidos' : `Pedidos de ${filterMonth}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground mb-1">Valor Total</p>
            <div className="text-3xl font-bold text-primary flex items-center gap-2">
              {formatCurrency(totalValue)}
              <TrendingUp className="h-5 w-5 opacity-50" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Parceiro</TableHead>
                <TableHead className="font-semibold">REQ / Pedidos</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Pagamento</TableHead>
                <TableHead className="text-right font-semibold">Valor Líquido</TableHead>
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
                  <TableRow key={`${order.prescriberName}-${index}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{order.prescriberName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {order.req ? `REQ: ${order.req}` : order.orderNumbers.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={order.status === 'Efetivado' 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.paymentStatus && (
                        <Badge variant="outline" className={order.paymentStatus === 'Pago' ? "border-green-500 text-green-600" : "border-amber-500 text-amber-600"}>
                          {order.paymentStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatCurrency(order.netValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
