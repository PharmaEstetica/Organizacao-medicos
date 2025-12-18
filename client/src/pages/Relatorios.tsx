import { useState } from "react";
import { ReportsList } from "@/components/ReportsList";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrescribers, useOrders, useReports, useCreateReport } from "@/hooks/useApi";
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
import { OrdersManager } from "@/components/OrdersManager";

export default function Relatorios() {
  const { data: prescribers = [] } = usePrescribers();
  const { data: orders = [] } = useOrders();
  const { data: reports = [] } = useReports();
  const createReport = useCreateReport();
  const { toast } = useToast();
  
  // Reports State
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get available months from orders
  const availableMonths = Array.from(new Set(orders.map(o => {
    const date = new Date(o.orderDate);
    return `${date.getMonth() + 1}/${date.getFullYear()}`; // "12/2023"
  }))).sort();

  const generatePrescriberPDF = (prescriber: any, effectiveOrders: any[], nonEffectiveOrders: any[], monthYear: string, download = false) => {
    const doc = new jsPDF();
    const commissionRate = parseFloat(prescriber.commissionPercentage);
    const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
    const totalCommission = effectiveOrders.reduce((sum, o) => sum + (parseFloat(o.netValue) * (commissionRate / 100)), 0);
    const totalNonEffectiveValue = nonEffectiveOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
    const totalNonEffectiveCommission = nonEffectiveOrders.reduce((sum, o) => sum + (parseFloat(o.netValue) * (commissionRate / 100)), 0);
    
    const conversionRate = (effectiveOrders.length / (effectiveOrders.length + nonEffectiveOrders.length)) * 100 || 0;

    // --- Header ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(prescriber.name.toUpperCase(), 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`CONVERSÃO ${conversionRate.toFixed(2)}%`, 195, 20, { align: "right" });

    // --- Pedidos Efetivados ---
    let currentY = 35;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Pedidos efetivados", 14, currentY);
    
    currentY += 5;

    const tableHeaders = [['Data', 'Status', 'Valor Líquido', 'Paciente', `${prescriber.commissionPercentage}%`]];
    
    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const effectiveRows = effectiveOrders.map(o => [
      new Date(o.orderDate).toLocaleDateString('pt-BR'),
      "Aprovado", // Hardcoded per requirement/image (mapped from 'Efetivado')
      formatCurrency(parseFloat(o.netValue)),
      o.patient || o.prescriberName, // Fallback if patient missing
      formatCurrency(parseFloat(o.netValue) * (commissionRate / 100))
    ]);

    // Footer Row for Effective
    const effectiveFooter = [
      ['TOTAL', '', formatCurrency(totalEffectiveValue), '', formatCurrency(totalCommission)],
      ['SALDO', '', '', '', formatCurrency(totalCommission)]
    ];

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: effectiveRows,
      foot: effectiveFooter,
      theme: 'plain', // Cleaner look, we will add manual styling
      headStyles: {
        fillColor: [230, 208, 222], // Light purple/lilac #E6D0DE
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: 3,
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 'auto' }, // Patient takes remaining space
        4: { cellWidth: 30, halign: 'right' },
      },
      didParseCell: function (data) {
        // Style the SALDO row specifically if needed, but footStyles handles bold
        if (data.section === 'foot' && data.row.index === 1) {
             // specific styling for SALDO row if needed
        }
      }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 20;

    // --- Pedidos Não Efetivados ---
    if (nonEffectiveOrders.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos não efetivados", 14, currentY);
        currentY += 5;

        const nonEffectiveRows = nonEffectiveOrders.map(o => [
            new Date(o.orderDate).toLocaleDateString('pt-BR'),
            o.status === 'Não efetivado' ? 'Recusado' : o.status, // Map status
            formatCurrency(parseFloat(o.netValue)),
            o.patient || o.prescriberName,
            formatCurrency(parseFloat(o.netValue) * (commissionRate / 100))
        ]);

        const nonEffectiveFooter = [
            ['TOTAL', '', formatCurrency(totalNonEffectiveValue), '', formatCurrency(totalNonEffectiveCommission)]
        ];

        autoTable(doc, {
            startY: currentY,
            head: tableHeaders,
            body: nonEffectiveRows,
            foot: nonEffectiveFooter,
            theme: 'plain',
            headStyles: {
                fillColor: [230, 208, 222],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [0, 0, 0],
                cellPadding: 3,
            },
            footStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25 },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 30, halign: 'right' },
            },
        });
    }

    if (download) {
        doc.save(`Relatorio_${prescriber.name.replace(/\s+/g, '_')}_${monthYear.replace('/', '-')}.pdf`);
    }
    
    return doc;
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
        const prescriberOrders = orders.filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() + 1 === month && 
                 d.getFullYear() === year && 
                 o.prescriberName.toLowerCase() === prescriber.name.toLowerCase();
        });

        if (prescriberOrders.length === 0) continue;

        const effectiveOrders = prescriberOrders.filter(o => o.status === 'Efetivado');
        const nonEffectiveOrders = prescriberOrders.filter(o => o.status === 'Não efetivado');
        
        const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
        const commissionRate = parseFloat(prescriber.commissionPercentage);
        const commissionValue = totalEffectiveValue * (commissionRate / 100);
        const expenses = 0;
        const finalBalance = commissionValue - expenses;
        const conversionRate = (effectiveOrders.length / prescriberOrders.length) * 100;

        // Create report record via API
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

    // Re-calculate orders for this specific report to regenerate the PDF
    const [month, year] = report.referenceMonth.split('/').map(Number);
    const prescriberOrders = orders.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() + 1 === month && 
               d.getFullYear() === year && 
               o.prescriberName.toLowerCase() === prescriber.name.toLowerCase();
    });

    const effectiveOrders = prescriberOrders.filter(o => o.status === 'Efetivado');
    const nonEffectiveOrders = prescriberOrders.filter(o => o.status === 'Não efetivado');

    toast({
        title: "Download Iniciado",
        description: `Baixando relatório de ${prescriber.name}...`,
    });
    
    generatePrescriberPDF(prescriber, effectiveOrders, nonEffectiveOrders, report.reference_month, true);
  };

  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Gestão Financeira
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie pedidos de parceiros e emita relatórios financeiros detalhados.
        </p>
      </div>

      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="pedidos">Pedidos de Parceiros</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios Financeiros</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <OrdersManager />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Gerar Relatórios Mensais</CardTitle>
              <CardDescription>
                Selecione o mês para calcular comissões e gerar os demonstrativos para todos os parceiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="w-[200px]">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.length === 0 ? (
                      <SelectItem value="empty" disabled>Sem dados</SelectItem>
                    ) : (
                      availableMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateAll} disabled={isGenerating || !selectedMonth}>
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
