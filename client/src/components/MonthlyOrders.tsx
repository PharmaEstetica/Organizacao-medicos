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

export function MonthlyOrders() {
  const { orders } = useApp();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalValue = orders.reduce((acc, order) => acc + order.netValue, 0);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-6">
        <div className="flex justify-between items-end">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Resumo dos Pedidos
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Consolidado do arquivo importado</p>
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
                <TableHead className="font-semibold">Prescritor</TableHead>
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Nº Pedidos</TableHead>
                <TableHead className="text-right font-semibold">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum pedido importado. Faça o upload de um CSV acima.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow key={`${order.prescriberName}-${index}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{order.prescriberName}</TableCell>
                    <TableCell>{order.patient || "-"}</TableCell>
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
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {order.orderNumbers.join(", ")}
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
