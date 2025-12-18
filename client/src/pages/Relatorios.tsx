import { useState, useRef, useEffect } from "react";
import { ReportsList } from "@/components/ReportsList";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrescribers, useCsvOrders, useReports, useCreateReport } from "@/hooks/useApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVUpload } from "@/components/CSVUpload";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "@/components/PasswordModal";

export default function Relatorios() {
  const { data: prescribers = [] } = usePrescribers();
  const { data: csvOrders = [] } = useCsvOrders();
  const { data: reports = [] } = useReports();
  const createReport = useCreateReport();
  const { toast } = useToast();
  
  const { 
    isLocked, 
    isProtected,
    showPasswordModal, 
    setShowPasswordModal, 
    verifyPassword,
    loading: accessLoading 
  } = useProtectedAccess('relatorios');
  
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("importar");

  useEffect(() => {
    if (isProtected && isLocked && !accessLoading) {
      setShowPasswordModal(true);
    }
  }, [isProtected, isLocked, accessLoading, setShowPasswordModal]);

  const availableMonths = Array.from(new Set(csvOrders.map(o => {
    const date = new Date(o.orderDate);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }))).sort();

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const sortByDate = (orders: any[]) => {
    return [...orders].sort((a, b) => 
      new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    );
  };

  const generatePrescriberPDF = (prescriber: any, effectiveOrders: any[], nonEffectiveOrders: any[], monthYear: string, expenses: number = 0, expenseDetails: { req: string; value: number }[] = []) => {
    const doc = new jsPDF();
    const commissionRate = parseFloat(prescriber.commissionPercentage);
    
    const sortedEffective = sortByDate(effectiveOrders);
    const sortedNonEffective = sortByDate(nonEffectiveOrders);
    
    const totalEffectiveValue = sortedEffective.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
    const totalCommission = totalEffectiveValue * (commissionRate / 100);
    const totalNonEffectiveValue = sortedNonEffective.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
    const totalNonEffectiveCommission = totalNonEffectiveValue * (commissionRate / 100);
    
    const conversionRate = (sortedEffective.length + sortedNonEffective.length) > 0
      ? (sortedEffective.length / (sortedEffective.length + sortedNonEffective.length)) * 100 
      : 0;

    const finalBalance = totalCommission - expenses;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(prescriber.name.toUpperCase(), 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`CONVERSÃO ${conversionRate.toFixed(2)}%`, 195, 20, { align: "right" });

    let currentY = 35;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Pedidos efetivados", 14, currentY);
    
    currentY += 5;

    const tableHeaders = [['Data', 'Status', 'Valor Líquido', 'Paciente', `${prescriber.commissionPercentage}%`]];

    const effectiveRows = sortedEffective.map(o => [
      new Date(o.orderDate).toLocaleDateString('pt-BR'),
      "Aprovado",
      formatCurrency(parseFloat(o.netValue)),
      (o.patient || o.prescriberName || '').substring(0, 40),
      formatCurrency(parseFloat(o.netValue) * (commissionRate / 100))
    ]);

    const effectiveFooter: (string | { content: string; styles: any })[][] = [
      [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(totalEffectiveValue), styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(totalCommission), styles: { fontStyle: 'bold' } }],
    ];

    if (expenses > 0) {
      const reqNumbers = expenseDetails.length > 0 
        ? expenseDetails.map(e => e.req).join(', ')
        : '';
      effectiveFooter.push([
        { content: 'COMPRAS', styles: { textColor: [200, 0, 0], fontStyle: 'bold' } },
        { content: reqNumbers ? `REQ ${reqNumbers}` : '', styles: { textColor: [200, 0, 0] } },
        '',
        '',
        { content: `- ${formatCurrency(expenses)}`, styles: { textColor: [200, 0, 0], fontStyle: 'bold' } }
      ]);
    }

    effectiveFooter.push([
      { content: 'SALDO', styles: { fontStyle: 'bold' } },
      '',
      '',
      '',
      { content: formatCurrency(finalBalance), styles: { fontStyle: 'bold' } }
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: effectiveRows,
      foot: effectiveFooter,
      theme: 'grid',
      headStyles: {
        fillColor: [230, 208, 222],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
        lineColor: [180, 160, 175],
        lineWidth: 0.5,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 9,
        cellPadding: 4,
        lineColor: [180, 180, 180],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 30, halign: 'right' },
      },
      showFoot: 'lastPage',
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 20;

    if (sortedNonEffective.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos não efetivados", 14, currentY);
        currentY += 5;

        const nonEffectiveRows = sortedNonEffective.map(o => [
            new Date(o.orderDate).toLocaleDateString('pt-BR'),
            o.status,
            formatCurrency(parseFloat(o.netValue)),
            (o.patient || o.prescriberName || '').substring(0, 40),
            formatCurrency(parseFloat(o.netValue) * (commissionRate / 100))
        ]);

        const nonEffectiveFooter: any[][] = [
            [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(totalNonEffectiveValue), styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(totalNonEffectiveCommission), styles: { fontStyle: 'bold' } }]
        ];

        autoTable(doc, {
            startY: currentY,
            head: tableHeaders,
            body: nonEffectiveRows,
            foot: nonEffectiveFooter,
            theme: 'grid',
            headStyles: {
                fillColor: [230, 208, 222],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 4,
                lineColor: [180, 160, 175],
                lineWidth: 0.5,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [0, 0, 0],
                cellPadding: 4,
                lineColor: [200, 200, 200],
                lineWidth: 0.5,
            },
            footStyles: {
                fillColor: [245, 245, 245],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 4,
                lineColor: [180, 180, 180],
                lineWidth: 0.5,
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25 },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 30, halign: 'right' },
            },
            showFoot: 'lastPage',
        });
    }

    doc.save(`Relatorio_${prescriber.name.replace(/\s+/g, '_')}_${monthYear.replace('/', '')}.pdf`);
  };

  const handleGenerateAll = async () => {
    if (!selectedMonth) {
      toast({
        title: "Erro",
        description: "Selecione um mês de referência.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const [month, year] = selectedMonth.split('/').map(Number);
      
      for (const prescriber of prescribers) {
        const prescriberOrders = csvOrders.filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() + 1 === month && 
                 d.getFullYear() === year && 
                 (o.prescriberName || '').toLowerCase() === prescriber.name.toLowerCase();
        });

        if (prescriberOrders.length === 0) continue;

        const effectiveOrders = prescriberOrders.filter(o => o.status === 'Aprovado');
        const nonEffectiveOrders = prescriberOrders.filter(o => o.status !== 'Aprovado');
        
        const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
        const commissionRate = parseFloat(prescriber.commissionPercentage);
        const commissionValue = totalEffectiveValue * (commissionRate / 100);
        const expenses = 0;
        const finalBalance = commissionValue - expenses;
        const conversionRate = (effectiveOrders.length / prescriberOrders.length) * 100;

        createReport.mutate({
          prescriberId: prescriber.id,
          referenceMonth: selectedMonth,
          totalOrders: prescriberOrders.length,
          effectiveOrders: effectiveOrders.length,
          conversionRate: conversionRate.toString(),
          totalEffectiveValue: totalEffectiveValue.toString(),
          commissionValue: commissionValue.toString(),
          expenses: expenses.toString(),
          finalBalance: finalBalance.toString(),
          pdfPath: "generated_on_demand" 
        });
      }

      toast({
        title: "Sucesso",
        description: "Relatórios gerados com sucesso!",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatórios.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const prescriber = prescribers.find(p => p.id === report.prescriberId);
    if (!prescriber) return;

    const [month, year] = report.referenceMonth.split('/').map(Number);
    const prescriberOrders = csvOrders.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() + 1 === month && 
               d.getFullYear() === year && 
               (o.prescriberName || '').toLowerCase() === prescriber.name.toLowerCase();
    });

    const effectiveOrders = prescriberOrders.filter(o => o.status === 'Aprovado');
    const nonEffectiveOrders = prescriberOrders.filter(o => o.status !== 'Aprovado');

    const expenses = parseFloat(report.expenses) || 0;

    toast({
        title: "Download Iniciado",
        description: `Baixando relatório de ${prescriber.name}...`,
    });
    
    generatePrescriberPDF(prescriber, effectiveOrders, nonEffectiveOrders, report.referenceMonth, expenses, []);
  };

  const handleReportGenerated = () => {
    setActiveTab("gerar");
  };

  if (accessLoading) {
    return (
      <div className="container py-10 max-w-screen-2xl flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProtected && isLocked) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => window.history.back()}
        onVerify={verifyPassword}
        title="Digite a senha para acessar os Relatórios"
      />
    );
  }

  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios Financeiros
        </h1>
        <p className="text-muted-foreground mt-2">
          Importe dados via CSV e gere relatórios financeiros por parceiro.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="importar" data-testid="tab-importar">Importar CSV</TabsTrigger>
          <TabsTrigger value="gerar" data-testid="tab-gerar">Gerar Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CSVUpload onReportGenerated={handleReportGenerated} />
        </TabsContent>

        <TabsContent value="gerar" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Gerar Relatórios em Lote</CardTitle>
              <CardDescription>
                Selecione o mês para calcular comissões e gerar os demonstrativos para todos os parceiros de uma vez.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="w-[200px]">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue placeholder="Selecione o Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.length === 0 ? (
                      <SelectItem value="empty" disabled>Sem dados importados</SelectItem>
                    ) : (
                      availableMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateAll} disabled={isGenerating || !selectedMonth} data-testid="button-generate-reports">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Processar Relatórios
              </Button>
            </CardContent>
          </Card>

          <ReportsList onDownload={handleDownload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
