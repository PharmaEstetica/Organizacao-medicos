import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useReports, usePrescribers } from "@/hooks/useApi";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "@/components/PasswordModal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CsvOrder {
  id: number;
  prescriberName: string;
  orderNumbers: string;
  orderDate: string;
  status: string;
  originalStatus?: string | null;
  netValue: string;
  patient?: string | null;
}

export function EditReportTab() {
  const { data: reports = [] } = useReports();
  const { data: prescribers = [] } = usePrescribers();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    isLocked,
    isProtected,
    showPasswordModal,
    setShowPasswordModal,
    verifyPassword,
    loading: accessLoading,
  } = useProtectedAccess("editar_relatorio");

  const [editPassword, setEditPassword] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [orders, setOrders] = useState<CsvOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isProtected && isLocked && !accessLoading) {
      setShowPasswordModal(true);
    }
  }, [isProtected, isLocked, accessLoading, setShowPasswordModal]);

  const handleVerifyWithCapture = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success) {
      setEditPassword(password);
    }
    return success;
  };

  const handleReportChange = async (reportId: string) => {
    setSelectedReportId(reportId);
    setSelectedIds(new Set());
    setOrders([]);
    if (!reportId) return;

    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/orders`);
      if (!res.ok) throw new Error("Falha ao carregar pedidos");
      const data: CsvOrder[] = await res.json();
      setOrders(data);
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar os pedidos.", variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (groupOrders: CsvOrder[]) => {
    const groupIds = groupOrders.map(o => o.id);
    const allSelected = groupIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach(id => next.delete(id));
      } else {
        groupIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}/orders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), password: editPassword }),
      });

      if (res.status === 401) {
        toast({ title: "Erro", description: "Senha incorreta. Por favor, recarregue a aba.", variant: "destructive" });
        setShowConfirmModal(false);
        return;
      }

      if (!res.ok) throw new Error("Falha ao remover pedidos");

      const removedCount = selectedIds.size;
      setSelectedIds(new Set());
      setShowConfirmModal(false);
      await handleReportChange(selectedReportId);
      await queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      toast({
        title: "Pedidos removidos",
        description: `${removedCount} pedido(s) removido(s) e o CSV vinculado foi deletado.`,
      });
    } catch {
      toast({ title: "Erro", description: "Falha ao remover os pedidos.", variant: "destructive" });
    } finally {
      setIsRemoving(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getPrescriberName = (prescriberId: number) =>
    prescribers.find(p => p.id === prescriberId)?.name ?? "Desconhecido";

  const effectiveOrders = orders.filter(o => o.status === "Efetivado");
  const nonEffectiveOrders = orders.filter(o => o.status !== "Efetivado");
  const selectedOrders = orders.filter(o => selectedIds.has(o.id));

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProtected && isLocked) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerify={handleVerifyWithCapture}
        title="Digite a senha para editar relatórios"
      />
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Editar Relatório</CardTitle>
          <CardDescription>
            Selecione um relatório salvo para visualizar e remover pedidos individualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base">Nenhum relatório salvo encontrado.</p>
              <p className="text-sm mt-1">Gere um relatório na aba "Importar CSV" primeiro.</p>
            </div>
          ) : (
            <Select value={selectedReportId} onValueChange={handleReportChange}>
              <SelectTrigger className="max-w-sm" data-testid="select-report-edit">
                <SelectValue placeholder="Selecione um relatório" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {reports.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {getPrescriberName(r.prescriberId)} — {r.referenceMonth}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {loadingOrders && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingOrders && selectedReportId && orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum pedido encontrado no CSV para este relatório.
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className="space-y-6">
              <OrderGroup
                title="Pedidos Efetivados"
                orders={effectiveOrders}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onToggleAll={() => toggleSelectAll(effectiveOrders)}
                formatCurrency={formatCurrency}
                variant="effective"
              />
              <OrderGroup
                title="Pedidos Não Efetivados"
                orders={nonEffectiveOrders}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onToggleAll={() => toggleSelectAll(nonEffectiveOrders)}
                formatCurrency={formatCurrency}
                variant="noneffective"
              />

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} pedido(s) selecionado(s)
                </span>
                <Button
                  variant="destructive"
                  disabled={selectedIds.size === 0}
                  onClick={() => setShowConfirmModal(true)}
                  className="rounded-sm gap-2"
                  data-testid="button-remove-selected"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Selecionados
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={(open) => !open && setShowConfirmModal(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Os pedidos abaixo serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="max-h-48 overflow-y-auto space-y-1 border border-border/60 rounded-sm p-3 bg-muted/30">
              {selectedOrders.map(o => (
                <div key={o.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(o.orderDate).toLocaleDateString("pt-BR")} · {o.originalStatus || o.status}
                    {o.patient ? ` · ${o.patient}` : ""}
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(o.netValue)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-sm border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                O CSV original vinculado a este relatório será deletado permanentemente.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isRemoving}
              data-testid="button-cancel-remove"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              data-testid="button-confirm-remove"
            >
              {isRemoving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removendo...</>
              ) : (
                "Confirmar Remoção"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OrderGroupProps {
  title: string;
  orders: CsvOrder[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  formatCurrency: (v: string | number) => string;
  variant: "effective" | "noneffective";
}

function OrderGroup({ title, orders, selectedIds, onToggle, onToggleAll, formatCurrency, variant }: OrderGroupProps) {
  if (orders.length === 0) return null;

  const allSelected = orders.every(o => selectedIds.has(o.id));
  const someSelected = orders.some(o => selectedIds.has(o.id));

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between px-3 py-2 rounded-sm ${
        variant === "effective"
          ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30"
          : "bg-muted/40 border border-border/60"
      }`}>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            data-state={someSelected && !allSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
            onCheckedChange={onToggleAll}
            data-testid={`checkbox-select-all-${variant}`}
          />
          <span className={`text-sm font-semibold ${
            variant === "effective" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
          }`}>
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{orders.length} pedido(s)</span>
      </div>

      <div className="space-y-1 pl-1">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => onToggle(order.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border cursor-pointer transition-colors ${
              selectedIds.has(order.id)
                ? "border-destructive/30 bg-destructive/5"
                : "border-border/40 hover:bg-muted/40"
            }`}
            data-testid={`row-order-edit-${order.id}`}
          >
            <Checkbox
              checked={selectedIds.has(order.id)}
              onCheckedChange={() => onToggle(order.id)}
              onClick={e => e.stopPropagation()}
              data-testid={`checkbox-order-${order.id}`}
            />
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-sm">
              <span className="text-muted-foreground">
                {new Date(order.orderDate).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-muted-foreground truncate">
                {order.originalStatus || order.status}
              </span>
              <span className="truncate text-muted-foreground">
                {order.patient || "—"}
              </span>
              <span className="font-mono font-semibold text-right">
                {formatCurrency(order.netValue)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
