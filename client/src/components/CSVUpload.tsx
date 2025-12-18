import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseCSV } from '@/lib/csvParser';
import { unificarSequenciais } from '@/lib/orderGrouping';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function CSVUpload() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const { addOrders, clearOrders } = useApp();
  const { toast } = useToast();

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
    reader.onload = (e) => {
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

      // Process and Group Orders
      const groupedOrders = unificarSequenciais(data);
      
      // Update Context
      clearOrders(); // Optional: clear previous month's orders
      addOrders(groupedOrders);

      setSuccess(`Processado com sucesso! ${groupedOrders.length} pedidos unificados encontrados.`);
      toast({
        title: "Upload Concluído",
        description: `${groupedOrders.length} pedidos foram importados e unificados.`,
      });
    };

    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };

    reader.readAsText(file);
  }, [addOrders, clearOrders, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1
  });

  const downloadReportModel = () => {
    setIsGeneratingModel(true);
    
    try {
        const doc = new jsPDF();
        
        // --- Header ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("EXEMPLO PRESCRITOR", 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`CONVERSÃO 45.45%`, 195, 20, { align: "right" });

        // --- Pedidos Efetivados ---
        let currentY = 35;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos efetivados", 14, currentY);
        
        currentY += 5;

        const tableHeaders = [['Data', 'Status', 'Valor Líquido', 'Paciente', '10%']];
        
        const effectiveRows = [
            ['01/12/2025', 'Aprovado', 'R$ 74,09', 'MARCIA HELENA GIACOMINI LOBO', 'R$ 7,41'],
            ['01/12/2025', 'Aprovado', 'R$ 477,90', 'RODRIGO DA SILVA NUNES', 'R$ 47,79'],
            ['02/12/2025', 'Aprovado', 'R$ 488,99', 'OSINEI ROQUE DA SILVEIRA', 'R$ 48,90'],
            ['02/12/2025', 'Aprovado', 'R$ 943,00', 'PAULA CRISTINA MENDES AMORIM', 'R$ 94,30'],
            ['03/12/2025', 'Aprovado', 'R$ 310,00', 'LEONARDO SOARES DA SILVA', 'R$ 31,00'],
        ];

        // Footer Row for Effective
        const effectiveFooter = [
          ['TOTAL', '', 'R$ 2.293,98', '', 'R$ 229,40'],
          ['SALDO', '', '', '', 'R$ 229,40']
        ];

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

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 20;

        // --- Pedidos Não Efetivados ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos não efetivados", 14, currentY);
        currentY += 5;

        const nonEffectiveRows = [
            ['01/12/2025', 'Recusado', 'R$ 115,90', 'MARCIA HELENA GIACOMINI LOBO', 'R$ 11,59'],
            ['01/12/2025', 'Recusado', 'R$ 434,70', 'RODRIGO DA SILVA NUNES', 'R$ 43,47'],
            ['02/12/2025', 'No carrinho', 'R$ 998,45', 'CAIO CESAR DIAS RIBEIRO', 'R$ 99,85'],
            ['03/12/2025', 'No carrinho', 'R$ 1.048,80', 'JOAO BATISTA CALMON...', 'R$ 104,88'],
            ['03/12/2025', 'No carrinho', 'R$ 646,95', 'ROGERIO OLIVEIRA SILVA', 'R$ 64,70'],
            ['04/12/2025', 'No carrinho', 'R$ 36,00', 'RENAN ERLACHER', 'R$ 3,60'],
        ];

        const nonEffectiveFooter = [
            ['TOTAL', '', 'R$ 3.280,80', '', 'R$ 328,08']
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

        doc.save("Modelo_Relatorio_Financeiro.pdf");
        
        toast({
            title: "Download Concluído",
            description: "O modelo PDF foi baixado com sucesso.",
        });

    } catch (e) {
        console.error(e);
        toast({
            title: "Erro",
            description: "Não foi possível gerar o modelo.",
            variant: "destructive"
        });
    } finally {
        setIsGeneratingModel(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Importar Pedidos</CardTitle>
        <Button variant="outline" size="sm" onClick={downloadReportModel} disabled={isGeneratingModel}>
          {isGeneratingModel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Baixar Modelo
        </Button>
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
  );
}
