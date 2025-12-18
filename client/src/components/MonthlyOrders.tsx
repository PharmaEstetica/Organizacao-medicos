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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Pedidos do Mês</CardTitle>
          <div className="text-2xl font-bold text-primary">
            Total: {formatCurrency(totalValue)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Prescritor</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nº Pedidos</TableHead>
                <TableHead className="text-right">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum pedido importado. Faça o upload de um CSV.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow key={`${order.prescriberName}-${index}`}>
                    <TableCell>
                      {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{order.prescriberName}</TableCell>
                    <TableCell>{order.patient || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Efetivado' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.orderNumbers.join(", ")}</TableCell>
                    <TableCell className="text-right font-bold">
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
