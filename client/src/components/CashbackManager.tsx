import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2,
  Wallet,
  TrendingUp,
  CreditCard,
  Trash2,
  AlertCircle,
  MinusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CashbackSummary {
  prescriber_id: number;
  name: string;
  specialty: string;
  total_cashback_earned: number;
  total_deductions: number;
  total_net_cashback: number;
  total_available: number;
  total_pending: number;
  total_paid: number;
  balance: number;
}

interface MonthlyBreakdown {
  id: number;
  month: string;
  gross_sales: number;
  cashback_percentage: number;
  cashback_amount: number;
  deductions: number;
  net_cashback: number;
  status: string;
}

interface PaymentHistory {
  id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
}

interface CashbackDetail extends CashbackSummary {
  monthly_breakdown: MonthlyBreakdown[];
  payments_history: PaymentHistory[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const formatMonth = (ym: string) => {
  const [year, mon] = ym.split("-");
  return `${MONTHS_PT[parseInt(mon) - 1]} ${year}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    available: { label: "Disponível", className: "bg-green-500 text-white border-green-500" },
    pending:   { label: "Pendente",   className: "bg-yellow-500 text-white border-yellow-500" },
    paid:      { label: "Pago",       className: "bg-gray-500 text-white border-gray-500" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={`text-xs rounded-full px-2.5 ${cfg.className}`}>{cfg.label}</Badge>;
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchAllCashback(): Promise<CashbackSummary[]> {
  const res = await fetch("/api/cashback/all");
  if (!res.ok) throw new Error("Falha ao buscar cashbacks");
  return res.json();
}

async function fetchCashbackDetail(id: number): Promise<CashbackDetail> {
  const res = await fetch(`/api/cashback/${id}`);
  if (!res.ok) throw new Error("Falha ao buscar detalhes do cashback");
  return res.json();
}

// ─── Delete with password ─────────────────────────────────────────────────────

function DeleteWithPasswordDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password) {
      toast({ title: "Senha obrigatória", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await onConfirm(password);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Senha de exclusão</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="rounded-sm"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              data-testid="input-delete-password"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="rounded-sm flex-1" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" className="rounded-sm flex-1" onClick={handleConfirm} disabled={loading} data-testid="button-confirm-delete">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment form ─────────────────────────────────────────────────────────────

function PaymentForm({
  prescriberId,
  maxAmount,
  onSuccess,
  onCancel,
}: {
  prescriberId: number;
  maxAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(",", "."));
    if (isNaN(num) || num <= 0) {
      toast({ title: "Valor inválido", description: "Digite um valor maior que zero.", variant: "destructive" });
      return;
    }
    if (num > maxAmount + 0.001) {
      toast({
        title: "Saldo insuficiente",
        description: `O valor máximo é ${fmt(maxAmount)}.`,
        variant: "destructive",
      });
      return;
    }
    if (!date) {
      toast({ title: "Data obrigatória", description: "Selecione a data do pagamento.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cashback/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriber_id: prescriberId, amount: num, payment_date: date, notes: notes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar pagamento");
      }
      toast({ title: "Pagamento registrado", description: `${fmt(num)} registrado com sucesso.` });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
        Saldo disponível: <span className="font-bold">{fmt(maxAmount)}</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Valor (R$)</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="rounded-sm"
          data-testid="input-payment-amount"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Data do Pagamento</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-sm"
          data-testid="input-payment-date"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Observação (opcional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: transferência bancária"
          className="rounded-sm"
          data-testid="input-payment-notes"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="rounded-sm flex-1" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button className="rounded-sm flex-1" onClick={handleSubmit} disabled={saving} data-testid="button-confirm-payment">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Confirmar Pagamento
        </Button>
      </div>
    </div>
  );
}

// ─── Prescriber Detail Modal ──────────────────────────────────────────────────

function DetailModal({
  prescriberId,
  prescriberName,
  photoUrl,
  open,
  onClose,
}: {
  prescriberId: number;
  prescriberName: string;
  photoUrl?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deleteBalance, setDeleteBalance] = useState<MonthlyBreakdown | null>(null);
  const [deletePayment, setDeletePayment] = useState<PaymentHistory | null>(null);

  const { data: detail, isLoading } = useQuery<CashbackDetail>({
    queryKey: ["cashback-detail", prescriberId],
    queryFn: () => fetchCashbackDetail(prescriberId),
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cashback-detail", prescriberId] });
    queryClient.invalidateQueries({ queryKey: ["cashback-all"] });
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    invalidate();
  };

  const handleDeleteBalance = async (password: string) => {
    if (!deleteBalance) return;
    const res = await fetch(`/api/cashback/balance/${deleteBalance.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao excluir");
    }
    toast({ title: "Saldo excluído", description: `Mês ${formatMonth(deleteBalance.month)} removido.` });
    setDeleteBalance(null);
    invalidate();
  };

  const handleDeletePayment = async (password: string) => {
    if (!deletePayment) return;
    const res = await fetch(`/api/cashback/payments/${deletePayment.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao excluir");
    }
    toast({ title: "Pagamento excluído", description: `${fmt(deletePayment.amount)} removido.` });
    setDeletePayment(null);
    invalidate();
  };

  const allMonths = detail?.monthly_breakdown ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt={prescriberName} className="h-full w-full object-cover" />
                ) : (
                  prescriberName.charAt(0)
                )}
              </div>
              <span>{prescriberName}</span>
            </DialogTitle>
            <DialogDescription>Resumo de cashback</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-6 mt-2">
              {/* Saldo em destaque */}
              <div className="rounded-sm border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{fmt(detail.balance)}</p>
                </div>
                <Wallet className="h-10 w-10 text-green-400" />
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-sm border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Cashback Bruto</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{fmt(detail.total_cashback_earned)}</p>
                </div>
                <div className="rounded-sm border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Deduções</p>
                  <p className="text-sm font-bold text-red-500 mt-0.5">{fmt(detail.total_deductions)}</p>
                </div>
                <div className="rounded-sm border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Cashback Líquido</p>
                  <p className="text-sm font-bold text-green-600 mt-0.5">{fmt(detail.total_net_cashback)}</p>
                </div>
                <div className="rounded-sm border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Pago</p>
                  <p className="text-sm font-bold text-gray-500 mt-0.5">{fmt(detail.total_paid)}</p>
                </div>
              </div>

              {/* Histórico Mensal */}
              {allMonths.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico Mensal</h3>
                  <div className="rounded-sm border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/30">
                          <TableHead className="text-xs">Mês</TableHead>
                          <TableHead className="text-xs text-right">Vendas</TableHead>
                          <TableHead className="text-xs text-right">%</TableHead>
                          <TableHead className="text-xs text-right">Cashback Bruto</TableHead>
                          <TableHead className="text-xs text-right text-red-600">Deduções</TableHead>
                          <TableHead className="text-xs text-right text-green-700">Cashback Líquido</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allMonths.map((b) => (
                          <TableRow key={b.month} className="hover:bg-muted/20">
                            <TableCell className="font-medium text-sm">{formatMonth(b.month)}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{fmt(b.gross_sales)}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{b.cashback_percentage.toFixed(1)}%</TableCell>
                            <TableCell className="text-right text-sm">{fmt(b.cashback_amount)}</TableCell>
                            <TableCell className="text-right text-sm text-red-500">
                              {b.deductions > 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <MinusCircle className="h-3 w-3" />
                                  {fmt(b.deductions)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-green-600">{fmt(b.net_cashback)}</TableCell>
                            <TableCell><StatusBadge status={b.status} /></TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-sm"
                                onClick={() => setDeleteBalance(b)}
                                data-testid={`button-delete-balance-${b.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              {/* Histórico de Pagamentos */}
              {detail.payments_history.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico de Pagamentos</h3>
                  <div className="space-y-2">
                    {detail.payments_history.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-sm border px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{fmt(p.amount)}</p>
                          {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">{p.payment_date}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-sm"
                            onClick={() => setDeletePayment(p)}
                            data-testid={`button-delete-payment-${p.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Registrar Pagamento */}
              <section>
                {showPaymentForm ? (
                  <div className="rounded-sm border p-4 space-y-2">
                    <h3 className="text-sm font-semibold">Registrar Pagamento</h3>
                    <PaymentForm
                      prescriberId={prescriberId}
                      maxAmount={detail.balance}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => setShowPaymentForm(false)}
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-sm w-full gap-2"
                    onClick={() => setShowPaymentForm(true)}
                    disabled={detail.balance <= 0}
                    data-testid="button-open-payment-form"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar Pagamento
                  </Button>
                )}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteWithPasswordDialog
        open={!!deleteBalance}
        title="Excluir saldo mensal"
        description={deleteBalance ? `Excluir cashback de ${formatMonth(deleteBalance.month)} (${fmt(deleteBalance.net_cashback)})? Esta ação não pode ser desfeita.` : ""}
        onConfirm={handleDeleteBalance}
        onCancel={() => setDeleteBalance(null)}
      />

      <DeleteWithPasswordDialog
        open={!!deletePayment}
        title="Excluir pagamento"
        description={deletePayment ? `Excluir o pagamento de ${fmt(deletePayment.amount)} de ${deletePayment.payment_date}? Esta ação não pode ser desfeita.` : ""}
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePayment(null)}
      />
    </>
  );
}

// ─── Main CashbackManager ─────────────────────────────────────────────────────

interface SelectedPrescriber {
  id: number;
  name: string;
  photoUrl?: string | null;
}

export function CashbackManager() {
  const [selected, setSelected] = useState<SelectedPrescriber | null>(null);
  const { data: prescribers = [] } = useQuery({ queryKey: ["prescribers"], queryFn: async () => {
    const res = await fetch("/api/prescribers");
    if (!res.ok) throw new Error();
    return res.json();
  }});

  const { data: summaries = [], isLoading } = useQuery<CashbackSummary[]>({
    queryKey: ["cashback-all"],
    queryFn: fetchAllCashback,
  });

  const getPrescriberPhoto = (id: number): string | null => {
    const p = prescribers.find((p: any) => p.id === id);
    return p?.photoUrl ?? null;
  };

  const totalNetCashback = summaries.reduce((s, p) => s + (p.total_net_cashback ?? 0), 0);
  const totalPending     = summaries.reduce((s, p) => s + p.total_pending, 0);
  const totalPaid        = summaries.reduce((s, p) => s + p.total_paid, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-sm border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Cashback Líquido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(totalNetCashback)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{fmt(totalPending)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Prescribers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-sm border bg-card py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Banknote className="h-10 w-10 opacity-20" />
          <p className="text-sm">Nenhum prescritor com tipo Cashback (C) encontrado.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-sm border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground">Prescritor</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground">Especialidade</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Cashback Líquido</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right text-red-600">Deduções</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Pago</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right text-green-700">Saldo</TableHead>
                  <TableHead className="h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => (
                  <TableRow key={s.prescriber_id} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
                          {getPrescriberPhoto(s.prescriber_id) ? (
                            <img src={getPrescriberPhoto(s.prescriber_id)!} alt={s.name} className="h-full w-full object-cover" />
                          ) : (
                            s.name.charAt(0)
                          )}
                        </div>
                        <span className="font-semibold text-foreground">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.specialty}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{fmt(s.total_net_cashback ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm text-red-500 tabular-nums">
                      {(s.total_deductions ?? 0) > 0 ? fmt(s.total_deductions) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right text-gray-500 tabular-nums text-sm">
                      {fmt(s.total_paid)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600 tabular-nums">
                      {fmt(s.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1.5 h-8"
                        onClick={() => setSelected({ id: s.prescriber_id, name: s.name, photoUrl: getPrescriberPhoto(s.prescriber_id) })}
                        data-testid={`button-view-cashback-${s.prescriber_id}`}
                      >
                        Detalhes <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {summaries.map((s) => (
              <div
                key={s.prescriber_id}
                className="rounded-sm border bg-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setSelected({ id: s.prescriber_id, name: s.name, photoUrl: getPrescriberPhoto(s.prescriber_id) })}
                data-testid={`card-cashback-${s.prescriber_id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
                    {getPrescriberPhoto(s.prescriber_id) ? (
                      <img src={getPrescriberPhoto(s.prescriber_id)!} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.specialty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-sm">{fmt(s.balance)}</p>
                  <p className="text-xs text-muted-foreground">saldo</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <DetailModal
          prescriberId={selected.id}
          prescriberName={selected.name}
          photoUrl={selected.photoUrl}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── CashbackBanner (for use in ReportsList) ──────────────────────────────────

export function CashbackBanner({ prescriberId, prescriberName }: { prescriberId: number; prescriberName: string }) {
  const { data } = useQuery<CashbackSummary>({
    queryKey: ["cashback-detail-banner", prescriberId],
    queryFn: async () => {
      const res = await fetch(`/api/cashback/${prescriberId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (!data || data.balance <= 0) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
      <Wallet className="h-3 w-3" />
      {fmt(data.balance)}
    </span>
  );
}
