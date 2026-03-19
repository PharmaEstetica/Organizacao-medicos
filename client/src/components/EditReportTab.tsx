import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Upload, AlertCircle, CheckCircle2, Loader2, AlertTriangle, Trash2, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "@/components/PasswordModal";
import { useToast } from "@/hooks/use-toast";
import { usePrescribers, useCreateReport } from "@/hooks/useApi";
import { parseCSV } from "@/lib/csvParser";
import { unificarSequenciais } from "@/lib/orderGrouping";
import { api, type ManualOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type Step = "upload" | "popup" | "edit";

interface EditableOrder {
  uid: string;
  orderNumbers: string[];
  orderDate: Date;
  status: "Efetivado" | "Não efetivado";
  originalStatus: string;
  netValue: number;
  editStr: string;
  patient?: string;
  modified: boolean;
}

function generateUID() {
  return Math.random().toString(36).slice(2);
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRL(str: string): number {
  const cleaned = str
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatCurrencyFull(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function EditReportTab() {
  const { data: prescribers = [] } = usePrescribers();
  const createReport = useCreateReport();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isLocked, isProtected, showPasswordModal, setShowPasswordModal, verifyPassword, loading: accessLoading } =
    useProtectedAccess("editar_relatorio");

  const [step, setStep] = useState<Step>("upload");
  const [csvError, setCsvError] = useState<string | null>(null);

  // popup state
  const [showPopup, setShowPopup] = useState(false);
  const [rawGroupedOrders, setRawGroupedOrders] = useState<ReturnType<typeof unificarSequenciais>>([]);
  const [csvMonth, setCsvMonth] = useState<{ month: number; year: number } | null>(null);
  const [selectedPrescriberId, setSelectedPrescriberId] = useState("");
  const [partnerOrders, setPartnerOrders] = useState<ManualOrder[]>([]);
  const [partnerOrdersTotal, setPartnerOrdersTotal] = useState(0);
  const [shouldDeduct, setShouldDeduct] = useState(true);
  const [loadingPartner, setLoadingPartner] = useState(false);

  // edit state
  const [editableOrders, setEditableOrders] = useState<EditableOrder[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isProtected && isLocked && !accessLoading) {
      setShowPasswordModal(true);
    }
  }, [isProtected, isLocked, accessLoading, setShowPasswordModal]);

  const onDrop = useCallback((files: File[]) => {
    setCsvError(null);
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { data, errors } = parseCSV(content);
      if (errors.length > 0) {
        setCsvError(`Erros encontrados: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`);
        return;
      }
      if (data.length === 0) {
        setCsvError("Nenhum pedido encontrado no arquivo.");
        return;
      }
      const grouped = unificarSequenciais(data);
      setRawGroupedOrders(grouped);
      if (grouped.length > 0) {
        const d = grouped[0].orderDate;
        setCsvMonth({ month: d.getMonth() + 1, year: d.getFullYear() });
      }
      setShowPopup(true);
    };
    reader.onerror = () => setCsvError("Erro ao ler o arquivo.");
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handlePrescriberChange = async (id: string) => {
    setSelectedPrescriberId(id);
    setPartnerOrders([]);
    setPartnerOrdersTotal(0);
    if (!id || !csvMonth) return;
    setLoadingPartner(true);
    try {
      const orders = await api.manualOrders.getByPrescriberAndMonth(Number(id), csvMonth.month, csvMonth.year);
      setPartnerOrders(orders);
      setPartnerOrdersTotal(orders.reduce((s, o) => s + parseFloat(o.netValue), 0));
    } catch {
      setPartnerOrders([]);
    } finally {
      setLoadingPartner(false);
    }
  };

  const handleContinueToEdit = () => {
    setShowPopup(false);
    const orders: EditableOrder[] = rawGroupedOrders.map((o) => ({
      uid: generateUID(),
      orderNumbers: o.orderNumbers,
      orderDate: o.orderDate,
      status: o.status,
      originalStatus: o.originalStatus || (o.status === "Efetivado" ? "Aprovado" : "Não efetivado"),
      netValue: o.netValue,
      editStr: formatBRL(o.netValue),
      patient: o.patient,
      modified: false,
    }));
    setEditableOrders(orders);
    setStep("edit");
  };

  const handleCancelPopup = () => {
    setShowPopup(false);
    setSelectedPrescriberId("");
    setPartnerOrders([]);
    setPartnerOrdersTotal(0);
    setShouldDeduct(true);
  };

  const handleValueChange = (uid: string, raw: string) => {
    setEditableOrders((prev) =>
      prev.map((o) => (o.uid === uid ? { ...o, editStr: raw, modified: true } : o))
    );
  };

  const handleValueBlur = (uid: string, raw: string) => {
    const num = parseBRL(raw);
    setEditableOrders((prev) =>
      prev.map((o) =>
        o.uid === uid
          ? { ...o, netValue: num, editStr: formatBRL(num), modified: o.netValue !== num || o.modified }
          : o
      )
    );
  };

  const handleRemove = (uid: string) => {
    setEditableOrders((prev) => prev.filter((o) => o.uid !== uid));
  };

  const prescriber = prescribers.find((p) => p.id === Number(selectedPrescriberId));
  const commissionRate = parseFloat(prescriber?.commissionPercentage ?? "0");

  const effectiveOrders = editableOrders.filter((o) => o.status === "Efetivado");
  const nonEffectiveOrders = editableOrders.filter((o) => o.status !== "Efetivado");
  const totalEffectiveValue = effectiveOrders.reduce((s, o) => s + o.netValue, 0);
  const totalCommission = totalEffectiveValue * (commissionRate / 100);
  const deductedExpenses = shouldDeduct ? partnerOrdersTotal : 0;
  const finalBalance = totalCommission - deductedExpenses;

  const effectiveCount = rawGroupedOrders.filter((o) => o.status === "Efetivado").length;
  const nonEffectiveCount = rawGroupedOrders.filter((o) => o.status !== "Efetivado").length;
  const conversionRatePopup =
    rawGroupedOrders.length > 0 ? ((effectiveCount / rawGroupedOrders.length) * 100).toFixed(2) : "0";

  const handleGeneratePDF = async () => {
    if (!prescriber) return;
    setIsGenerating(true);
    try {
      const sorted = (arr: EditableOrder[]) =>
        [...arr].sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
      const se = sorted(effectiveOrders);
      const sn = sorted(nonEffectiveOrders);
      const totalNonEffective = sn.reduce((s, o) => s + o.netValue, 0);
      const totalNonEffectiveComm = totalNonEffective * (commissionRate / 100);
      const convRate =
        editableOrders.length > 0 ? (se.length / editableOrders.length) * 100 : 0;
      const monthYear = csvMonth ? `${csvMonth.month}/${csvMonth.year}` : "";

      // Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(prescriber.name.toUpperCase(), 14, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`CONVERSÃO ${convRate.toFixed(2)}%`, 195, 20, { align: "right" });

      let y = 35;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos efetivados", 14, y);
      y += 5;

      const headers = [["Data", "Status", "Valor Líquido", "Paciente", `${prescriber.commissionPercentage}%`]];
      const effectiveRows = se.map((o) => [
        o.orderDate.toLocaleDateString("pt-BR"),
        "Aprovado",
        formatCurrencyFull(o.netValue),
        (o.patient || "").substring(0, 40),
        formatCurrencyFull(o.netValue * (commissionRate / 100)),
      ]);
      const footer: any[][] = [
        [{ content: "TOTAL", styles: { fontStyle: "bold" } }, "", { content: formatCurrencyFull(totalEffectiveValue), styles: { fontStyle: "bold" } }, "", { content: formatCurrencyFull(totalCommission), styles: { fontStyle: "bold" } }],
      ];
      if (deductedExpenses > 0) {
        const reqNums = partnerOrders.map((o) => o.req || o.orderNumbers).join(", ");
        footer.push([
          { content: "COMPRAS", styles: { textColor: [200, 0, 0], fontStyle: "bold" } },
          { content: reqNums ? `REQ ${reqNums}` : "", styles: { textColor: [200, 0, 0] } },
          "", "",
          { content: `- ${formatCurrencyFull(deductedExpenses)}`, styles: { textColor: [200, 0, 0], fontStyle: "bold" } },
        ]);
      }
      footer.push([
        { content: "SALDO", styles: { fontStyle: "bold" } }, "", "", "",
        { content: formatCurrencyFull(finalBalance), styles: { fontStyle: "bold" } },
      ]);

      const tableStyle = {
        headStyles: { fillColor: [220, 190, 210], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, cellPadding: 4, lineColor: [200, 160, 185], lineWidth: 0.5 },
        bodyStyles: { fontSize: 9, textColor: [0, 0, 0], cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
        footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 9, cellPadding: 4, lineColor: [180, 180, 180], lineWidth: 0.5 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 35, halign: "right" }, 3: { cellWidth: "auto" }, 4: { cellWidth: 30, halign: "right" } },
        showFoot: "lastPage" as const,
      };

      autoTable(doc, { startY: y, head: headers, body: effectiveRows, foot: footer, theme: "grid", ...tableStyle });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 20;

      if (sn.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos não efetivados", 14, y);
        y += 5;
        const nonRows = sn.map((o) => [
          o.orderDate.toLocaleDateString("pt-BR"),
          o.originalStatus || o.status,
          formatCurrencyFull(o.netValue),
          (o.patient || "").substring(0, 40),
          formatCurrencyFull(o.netValue * (commissionRate / 100)),
        ]);
        const nonFooter = [
          [{ content: "TOTAL", styles: { fontStyle: "bold" } }, "", { content: formatCurrencyFull(totalNonEffective), styles: { fontStyle: "bold" } }, "", { content: formatCurrencyFull(totalNonEffectiveComm), styles: { fontStyle: "bold" } }],
        ];
        autoTable(doc, { startY: y, head: headers, body: nonRows, foot: nonFooter, theme: "grid", ...tableStyle });
      }

      doc.save(`Relatorio_${prescriber.name.replace(/\s+/g, "_")}_${monthYear.replace("/", "")}.pdf`);

      // Save report to DB
      await createReport.mutateAsync({
        prescriberId: prescriber.id,
        referenceMonth: monthYear,
        totalOrders: editableOrders.length,
        effectiveOrders: se.length,
        conversionRate: convRate.toFixed(2),
        totalEffectiveValue: totalEffectiveValue.toFixed(2),
        commissionValue: totalCommission.toFixed(2),
        expenses: deductedExpenses.toFixed(2),
        finalBalance: finalBalance.toFixed(2),
        pdfPath: "edited_on_demand",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      toast({ title: "Relatório Gerado", description: `PDF de ${prescriber.name} gerado e salvo com sucesso.` });

      // Reset
      setStep("upload");
      setEditableOrders([]);
      setRawGroupedOrders([]);
      setSelectedPrescriberId("");
      setPartnerOrders([]);
      setPartnerOrdersTotal(0);
      setShouldDeduct(true);
      setCsvError(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao gerar o relatório.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToUpload = () => {
    setStep("upload");
    setEditableOrders([]);
    setRawGroupedOrders([]);
    setSelectedPrescriberId("");
    setPartnerOrders([]);
    setPartnerOrdersTotal(0);
    setShouldDeduct(true);
    setCsvError(null);
  };

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
        onVerify={verifyPassword}
        title="Digite a senha para editar relatórios"
      />
    );
  }

  return (
    <>
      {/* STEP: UPLOAD */}
      {step === "upload" && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Editar Relatório — Upload de CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                csvError ? "border-destructive/50 bg-destructive/5" : ""
              )}
              data-testid="edit-csv-dropzone"
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className={cn("p-4 rounded-full bg-muted", isDragActive && "bg-primary/10 text-primary", csvError && "bg-destructive/10 text-destructive")}>
                  {csvError ? <AlertCircle className="w-8 h-8" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{isDragActive ? "Solte o arquivo aqui" : "Clique ou arraste o CSV aqui"}</h3>
                  <p className="text-sm text-muted-foreground">Suporta apenas arquivos .csv (Separador: ponto e vírgula)</p>
                </div>
                {!isDragActive && !csvError && (
                  <Button variant="secondary" size="sm" className="mt-2">Selecionar Arquivo</Button>
                )}
              </div>
            </div>
            {csvError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{csvError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP: EDIT */}
      {step === "edit" && prescriber && (
        <div className="space-y-6">
          {/* Summary panel */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Efetivado</p>
                <p className="text-xl font-bold text-foreground">{formatCurrencyFull(totalEffectiveValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Comissão ({prescriber.commissionPercentage}%)</p>
                <p className="text-xl font-bold text-primary">{formatCurrencyFull(totalCommission)}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Saldo Final</p>
                <p className={cn("text-xl font-bold", finalBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600")}>
                  {formatCurrencyFull(finalBalance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Efetivados */}
          {effectiveOrders.length > 0 && (
            <OrderSection
              title="Pedidos Efetivados"
              orders={effectiveOrders}
              commissionRate={commissionRate}
              onValueChange={handleValueChange}
              onValueBlur={handleValueBlur}
              onRemove={handleRemove}
              variant="effective"
            />
          )}

          {/* Não Efetivados */}
          {nonEffectiveOrders.length > 0 && (
            <OrderSection
              title="Pedidos Não Efetivados"
              orders={nonEffectiveOrders}
              commissionRate={commissionRate}
              onValueChange={handleValueChange}
              onValueBlur={handleValueBlur}
              onRemove={handleRemove}
              variant="noneffective"
            />
          )}

          {editableOrders.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>Todos os pedidos foram removidos.</p>
            </div>
          )}

          {deductedExpenses > 0 && (
            <div className="flex items-start gap-2 rounded-sm border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Desconto de parceiros:</strong> {formatCurrencyFull(deductedExpenses)} (pedidos pendentes)
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={handleBackToUpload} className="rounded-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating || editableOrders.length === 0}
              className="rounded-sm gap-2"
              data-testid="button-generate-edited-report"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Gerar Relatório
            </Button>
          </div>
        </div>
      )}

      {/* POPUP: Vincular CSV ao Cadastro */}
      <Dialog open={showPopup} onOpenChange={(open) => !open && handleCancelPopup()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vincular CSV ao Cadastro</DialogTitle>
            <DialogDescription>Selecione o prescritor para calcular a porcentagem:</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={selectedPrescriberId} onValueChange={handlePrescriberChange}>
              <SelectTrigger data-testid="select-prescriber-edit-csv">
                <SelectValue placeholder="Selecione um prescritor" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {prescribers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} — {p.commissionPercentage}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPrescriberId && (
              <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
                <p><strong>Pedidos encontrados no CSV:</strong> {rawGroupedOrders.length}</p>
                <p><strong>Efetivados (Aprovado):</strong> {effectiveCount}</p>
                <p><strong>Não efetivados (Recusado/No carrinho):</strong> {nonEffectiveCount}</p>
                <p><strong>Taxa de conversão:</strong> {conversionRatePopup}%</p>
              </div>
            )}

            {loadingPartner && <div className="text-sm text-muted-foreground">Buscando pedidos de parceiros...</div>}

            {partnerOrders.length > 0 && (
              <div className="border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Pedidos de Parceiros Encontrados</span>
                </div>
                <div className="space-y-1 text-sm">
                  {partnerOrders.map((order) => (
                    <div key={order.id} className="flex justify-between">
                      <span>REQ {order.req || order.orderNumbers}</span>
                      <span>{formatCurrencyFull(parseFloat(order.netValue))}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-amber-500/30">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total a descontar:</span>
                    <span>{formatCurrencyFull(partnerOrdersTotal)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="edit-deduct-partner"
                    checked={shouldDeduct}
                    onCheckedChange={(v) => setShouldDeduct(v as boolean)}
                    data-testid="checkbox-edit-deduct-partner"
                  />
                  <label htmlFor="edit-deduct-partner" className="text-sm font-medium cursor-pointer">
                    Descontar do saldo final
                  </label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPopup} data-testid="button-cancel-edit-csv">
              Cancelar
            </Button>
            <Button
              onClick={handleContinueToEdit}
              disabled={!selectedPrescriberId}
              data-testid="button-continue-to-edit"
            >
              Continuar para Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OrderSectionProps {
  title: string;
  orders: EditableOrder[];
  commissionRate: number;
  onValueChange: (uid: string, raw: string) => void;
  onValueBlur: (uid: string, raw: string) => void;
  onRemove: (uid: string) => void;
  variant: "effective" | "noneffective";
}

function OrderSection({ title, orders, commissionRate, onValueChange, onValueBlur, onRemove, variant }: OrderSectionProps) {
  return (
    <Card className="border-border overflow-hidden">
      <div className={cn(
        "px-4 py-3 flex items-center justify-between border-b border-border",
        variant === "effective"
          ? "bg-emerald-50 dark:bg-emerald-950/20"
          : "bg-muted/30"
      )}>
        <span className={cn(
          "text-sm font-bold uppercase tracking-wider",
          variant === "effective" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
        )}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{orders.length} pedido(s)</span>
      </div>

      <div className="hidden md:grid grid-cols-[110px_1fr_150px_1fr_100px_40px] gap-x-3 px-4 py-2 border-b border-border/40 bg-muted/10">
        {["Data", "Status", "Valor Líquido", "Paciente", "Comissão", ""].map((h) => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
        ))}
      </div>

      <div className="divide-y divide-border/40">
        {orders.map((order) => (
          <div
            key={order.uid}
            className={cn(
              "grid grid-cols-2 md:grid-cols-[110px_1fr_150px_1fr_100px_40px] gap-x-3 gap-y-1 px-4 py-3 items-center transition-colors hover:bg-muted/20",
              order.modified && "border-l-2 border-blue-500"
            )}
            data-testid={`row-edit-${order.uid}`}
          >
            <span className="text-sm text-muted-foreground">
              {order.orderDate.toLocaleDateString("pt-BR")}
            </span>
            <span className="text-sm text-muted-foreground">{order.originalStatus || order.status}</span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
              <input
                type="text"
                value={order.editStr}
                onChange={(e) => onValueChange(order.uid, e.target.value)}
                onBlur={(e) => onValueBlur(order.uid, e.target.value)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "w-full pl-7 pr-2 py-1.5 text-sm font-mono text-right rounded-sm border bg-transparent",
                  order.modified
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-border/50 focus:border-primary"
                )}
                data-testid={`input-value-${order.uid}`}
              />
            </div>
            <span className="text-sm text-muted-foreground truncate">{order.patient || "—"}</span>
            <span className="text-sm font-mono text-right font-semibold">
              {formatCurrencyFull(order.netValue * (commissionRate / 100))}
            </span>
            <button
              onClick={() => onRemove(order.uid)}
              className="flex items-center justify-center h-8 w-8 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              data-testid={`button-remove-order-${order.uid}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
