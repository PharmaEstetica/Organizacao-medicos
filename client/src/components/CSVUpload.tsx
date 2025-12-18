import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle2, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { parseCSV } from '@/lib/csvParser';
import { unificarSequenciais } from '@/lib/orderGrouping';
import { useCreateCsvOrder, useDeleteAllCsvOrders, usePrescribers } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api, type Prescriber, type ManualOrder, type CsvOrder } from '@/lib/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ParsedOrder {
  prescriberName: string;
  orderNumbers: number[];
  orderDate: Date;
  status: string;
  originalStatus?: string;
  netValue: number;
  patient?: string;
}

export function CSVUpload() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const createCsvOrder = useCreateCsvOrder();
  const deleteAllCsvOrders = useDeleteAllCsvOrders();
  const { data: prescribers = [] } = usePrescribers();
  const { toast } = useToast();

  const [showPrescriberDialog, setShowPrescriberDialog] = useState(false);
  const [selectedPrescriberId, setSelectedPrescriberId] = useState<string>('');
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [partnerOrders, setPartnerOrders] = useState<ManualOrder[]>([]);
  const [partnerOrdersTotal, setPartnerOrdersTotal] = useState(0);
  const [shouldDeductPartnerOrders, setShouldDeductPartnerOrders] = useState(true);
  const [csvMonth, setCsvMonth] = useState<{ month: number; year: number } | null>(null);
  const [isLoadingPartnerOrders, setIsLoadingPartnerOrders] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    const file = acceptedFiles[0];

    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const { data, errors } = parseCSV(content);

      if (errors.length > 0) {
        setError(`Erros encontrados: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
        return;
      }

      if (data.length === 0) {
        setError('Nenhum pedido encontrado no arquivo.');
        return;
      }

      const groupedOrders = unificarSequenciais(data);
      setParsedOrders(groupedOrders);

      if (groupedOrders.length > 0) {
        const firstOrderDate = groupedOrders[0].orderDate;
        setCsvMonth({
          month: firstOrderDate.getMonth() + 1,
          year: firstOrderDate.getFullYear()
        });
      }

      setShowPrescriberDialog(true);
    };

    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };

    reader.readAsText(file);
  }, []);

  const handlePrescriberChange = async (prescriberId: string) => {
    setSelectedPrescriberId(prescriberId);
    
    if (!prescriberId || !csvMonth) return;

    setIsLoadingPartnerOrders(true);
    try {
      const orders = await api.manualOrders.getByPrescriberAndMonth(
        Number(prescriberId),
        csvMonth.month,
        csvMonth.year
      );
      setPartnerOrders(orders);
      const total = orders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
      setPartnerOrdersTotal(total);
    } catch (err) {
      console.error('Error fetching partner orders:', err);
      setPartnerOrders([]);
      setPartnerOrdersTotal(0);
    } finally {
      setIsLoadingPartnerOrders(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const generatePrescriberPDF = (
    prescriber: Prescriber,
    effectiveOrders: ParsedOrder[],
    nonEffectiveOrders: ParsedOrder[],
    expenses: { orders: ManualOrder[]; total: number; shouldDeduct: boolean }
  ) => {
    const doc = new jsPDF();
    const commissionRate = parseFloat(prescriber.commissionPercentage);
    const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + o.netValue, 0);
    const totalCommission = totalEffectiveValue * (commissionRate / 100);
    const totalNonEffectiveValue = nonEffectiveOrders.reduce((sum, o) => sum + o.netValue, 0);
    const totalNonEffectiveCommission = totalNonEffectiveValue * (commissionRate / 100);
    
    const conversionRate = effectiveOrders.length + nonEffectiveOrders.length > 0 
      ? (effectiveOrders.length / (effectiveOrders.length + nonEffectiveOrders.length)) * 100 
      : 0;

    const deductedExpenses = expenses.shouldDeduct ? expenses.total : 0;
    const finalBalance = totalCommission - deductedExpenses;

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

    const effectiveRows = effectiveOrders.map(o => [
      o.orderDate.toLocaleDateString('pt-BR'),
      "Aprovado",
      formatCurrency(o.netValue),
      (o.patient || o.prescriberName).substring(0, 40),
      formatCurrency(o.netValue * (commissionRate / 100))
    ]);

    const effectiveFooter: (string | { content: string; styles: any })[][] = [
      ['TOTAL', '', formatCurrency(totalEffectiveValue), '', formatCurrency(totalCommission)],
    ];

    if (expenses.orders.length > 0 && expenses.shouldDeduct) {
      const reqNumbers = expenses.orders.map(o => o.req || o.orderNumbers).join(', ');
      effectiveFooter.push([
        { content: `COMPRAS`, styles: { textColor: [200, 0, 0] } },
        { content: `REQ ${reqNumbers}`, styles: { textColor: [200, 0, 0] } },
        '',
        '',
        { content: `- ${formatCurrency(deductedExpenses)}`, styles: { textColor: [200, 0, 0] } }
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
        fontStyle: 'normal',
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 20;

    if (nonEffectiveOrders.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos não efetivados", 14, currentY);
      currentY += 5;

      const nonEffectiveRows = nonEffectiveOrders.map(o => [
        o.orderDate.toLocaleDateString('pt-BR'),
        o.originalStatus || o.status,
        formatCurrency(o.netValue),
        (o.patient || o.prescriberName).substring(0, 40),
        formatCurrency(o.netValue * (commissionRate / 100))
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
          1: { cellWidth: 30 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 30, halign: 'right' },
        },
      });
    }

    const monthYear = csvMonth ? `${String(csvMonth.month).padStart(2, '0')}${csvMonth.year}` : '';
    doc.save(`Relatorio_${prescriber.name.replace(/\s+/g, '_')}_${monthYear}.pdf`);
  };

  const handleGenerateReport = async () => {
    if (!selectedPrescriberId) {
      toast({
        title: "Erro",
        description: "Selecione um prescritor.",
        variant: "destructive",
      });
      return;
    }

    const prescriber = prescribers.find(p => p.id === Number(selectedPrescriberId));
    if (!prescriber) return;

    try {
      await deleteAllCsvOrders.mutateAsync();
    } catch (err) {
    }

    let successCount = 0;
    let errorCount = 0;
    
    for (const order of parsedOrders) {
      try {
        await createCsvOrder.mutateAsync({
          prescriberName: order.prescriberName,
          orderNumbers: order.orderNumbers.join(','),
          orderDate: order.orderDate.toISOString(),
          status: order.originalStatus || order.status,
          netValue: order.netValue.toString(),
          patient: order.patient,
        });
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    const effectiveOrders = parsedOrders.filter(o => o.status === 'Aprovado');
    const nonEffectiveOrders = parsedOrders.filter(o => o.status !== 'Aprovado');

    generatePrescriberPDF(prescriber, effectiveOrders, nonEffectiveOrders, {
      orders: partnerOrders,
      total: partnerOrdersTotal,
      shouldDeduct: shouldDeductPartnerOrders
    });

    setShowPrescriberDialog(false);
    setSelectedPrescriberId('');
    setParsedOrders([]);
    setPartnerOrders([]);
    setPartnerOrdersTotal(0);
    setShouldDeductPartnerOrders(true);

    setSuccess(`Relatório gerado! ${successCount} pedidos importados.`);
    toast({
      title: "Relatório Gerado",
      description: `PDF criado com sucesso para ${prescriber.name}.`,
    });
  };

  const handleCancelDialog = () => {
    setShowPrescriberDialog(false);
    setSelectedPrescriberId('');
    setParsedOrders([]);
    setPartnerOrders([]);
    setPartnerOrdersTotal(0);
    setShouldDeductPartnerOrders(true);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const headers = ['Nome', 'Número', 'Data', 'Status', 'Valor Líquido', 'Paciente'];
    const example = ['Dr. Silva', '12345', '15/05/2023', 'Aprovado', 'R$ 150,00', 'João Doe'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(";") + "\n" 
      + example.join(";");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_importacao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = async () => {
    try {
      await deleteAllCsvOrders.mutateAsync();
      setSuccess(null);
      setError(null);
      toast({
        title: "Dados Limpos",
        description: "Todos os dados importados foram removidos.",
      });
    } catch (err) {
      setError("Erro ao limpar os dados.");
    }
  };

  const selectedPrescriber = prescribers.find(p => p.id === Number(selectedPrescriberId));

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Importar CSV</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearData} data-testid="button-clear-csv">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Dados
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="mr-2 h-4 w-4" />
              Baixar Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ease-in-out",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              error ? "border-destructive/50 bg-destructive/5" : "",
              success ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""
            )}
            data-testid="csv-dropzone"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={cn(
                "p-4 rounded-full bg-muted",
                isDragActive && "bg-primary/10 text-primary",
                success && "bg-green-100 text-green-600 dark:bg-green-900/20",
                error && "bg-destructive/10 text-destructive"
              )}>
                {success ? <CheckCircle2 className="w-8 h-8" /> : 
                 error ? <AlertCircle className="w-8 h-8" /> : 
                 <Upload className="w-8 h-8 text-muted-foreground" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {isDragActive ? "Solte o arquivo aqui" : "Clique ou arraste o CSV aqui"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Suporta apenas arquivos .csv (Separador: ponto e vírgula)
                </p>
              </div>
              {!isDragActive && !success && !error && (
                <Button variant="secondary" size="sm" className="mt-2">
                  Selecionar Arquivo
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPrescriberDialog} onOpenChange={setShowPrescriberDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vincular CSV ao Cadastro</DialogTitle>
            <DialogDescription>
              Selecione o prescritor para calcular a comissão:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={selectedPrescriberId} onValueChange={handlePrescriberChange}>
              <SelectTrigger data-testid="select-prescriber-csv">
                <SelectValue placeholder="Selecione um prescritor" />
              </SelectTrigger>
              <SelectContent>
                {prescribers.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} - {p.commissionPercentage}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPrescriberId && (
              <div className="text-sm text-muted-foreground">
                <p><strong>Pedidos encontrados no CSV:</strong> {parsedOrders.length}</p>
                <p><strong>Efetivados:</strong> {parsedOrders.filter(o => o.status === 'Aprovado').length}</p>
                <p><strong>Não efetivados:</strong> {parsedOrders.filter(o => o.status !== 'Aprovado').length}</p>
              </div>
            )}

            {isLoadingPartnerOrders && (
              <div className="text-sm text-muted-foreground">Buscando pedidos de parceiros...</div>
            )}

            {partnerOrders.length > 0 && (
              <div className="border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Pedidos de Parceiros Encontrados</span>
                </div>

                <div className="space-y-1 text-sm">
                  {partnerOrders.map(order => (
                    <div key={order.id} className="flex justify-between">
                      <span>REQ {order.req || order.orderNumbers}</span>
                      <span>{formatCurrency(parseFloat(order.netValue))}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-amber-500/30">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total a descontar:</span>
                    <span>{formatCurrency(partnerOrdersTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="deduct-partner" 
                    checked={shouldDeductPartnerOrders}
                    onCheckedChange={(checked) => setShouldDeductPartnerOrders(checked as boolean)}
                    data-testid="checkbox-deduct-partner"
                  />
                  <label htmlFor="deduct-partner" className="text-sm font-medium cursor-pointer">
                    Descontar do saldo final
                  </label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialog} data-testid="button-cancel-csv">
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={!selectedPrescriberId}
              data-testid="button-generate-report"
            >
              Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
