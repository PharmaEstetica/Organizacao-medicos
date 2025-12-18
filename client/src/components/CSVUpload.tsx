import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseCSV } from '@/lib/csvParser';
import { unificarSequenciais } from '@/lib/orderGrouping';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function CSVUpload() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const downloadTemplate = () => {
    const headers = ['Nome', 'Número', 'Data', 'Status', 'Valor Líquido', 'Paciente'];
    const example = ['Dr. Silva', '12345', '15/05/2023', 'Efetivado', 'R$ 150,00', 'João Doe'];
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Importar Pedidos</CardTitle>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
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
