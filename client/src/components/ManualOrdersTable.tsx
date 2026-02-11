import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useManualOrders, usePrescribers, useDeleteManualOrder } from "@/hooks/useApi";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "./PasswordModal";

interface ManualOrdersTableProps {
  filterMonth?: string;
}

export function ManualOrdersTable({ filterMonth = "all" }: ManualOrdersTableProps) {
  const { data: orders = [] } = useManualOrders();
  const { data: prescribers = [] } = usePrescribers();
  const deleteOrder = useDeleteManualOrder();
  const { isLocked, verifyPassword } = useProtectedAccess('relatorios');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPrescriberName = (prescriberId: number) => {
    const prescriber = prescribers.find(p => p.id === prescriberId);
    return prescriber?.name || 'Desconhecido';
  };

  const handleDeleteClick = (orderId: number) => {
    if (isLocked) {
      setPendingDeleteId(orderId);
      setShowPasswordModal(true);
    } else {
      deleteOrder.mutate(orderId);
    }
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success && pendingDeleteId !== null) {
      setShowPasswordModal(false);
      deleteOrder.mutate(pendingDeleteId);
      setPendingDeleteId(null);
    }
    return success;
  };

  const filteredOrders = filterMonth === "all" 
    ? orders 
    : orders.filter(o => {
        const date = new Date(o.orderDate);
        const orderMonth = `${date.getMonth() + 1}/${date.getFullYear()}`;
        return orderMonth === filterMonth;
      });

  const totalValue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);

  return (
    <>
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
          <div>
            <CardTitle className="text-lg font-bold">Pedidos Manuais</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {filteredOrders.length} pedido(s) encontrado(s)
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(totalValue)}
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
                <TableHead className="h-10 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors border-b border-border/40" data-testid={`row-order-${order.id}`}>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-sm">{getPrescriberName(order.prescriberId)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {order.req ? <span className="text-primary font-bold">#{order.req}</span> : order.orderNumbers}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`rounded-sm border font-medium px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          order.status === 'Aprovado' 
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
                          : order.status === 'Recusado'
                          ? "border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20"
                          : "border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-900"
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.paymentStatus && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-sm ${
                          order.paymentStatus === 'paid' 
                          ? 'text-green-600 bg-green-100/50' 
                          : 'text-amber-600 bg-amber-100/50'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground text-sm font-mono">
                      {formatCurrency(order.netValue)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(order.id)}
                        data-testid={`button-delete-order-${order.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingDeleteId(null); }}
        onVerify={handlePasswordVerify}
        title="Digite a senha de relatórios para excluir este pedido."
      />
    </>
  );
}
