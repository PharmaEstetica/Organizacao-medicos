import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, Wallet, Trash2 } from "lucide-react";
import { useReports, usePrescribers, useDeleteReport } from "@/hooks/useApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ReportsListProps {
  onDownload: (reportId: number) => void;
}

export function ReportsList({ onDownload }: ReportsListProps) {
  const { data: reports = [] } = useReports();
  const { data: prescribers = [] } = usePrescribers();
  const deleteReport = useDeleteReport();
  const { toast } = useToast();
  
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPrescriberName = (id: number) => {
    return prescribers.find(p => p.id === id)?.name || "Desconhecido";
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const handleDelete = async (reportId: number) => {
    setIsDeleting(true);
    try {
      await deleteReport.mutateAsync(reportId);
      toast({
        title: "Sucesso",
        description: "Relatório deletado com sucesso.",
      });
      setReportToDelete(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Falha ao deletar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm mt-8">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Mês Ref.</TableHead>
              <TableHead className="font-semibold">Prescritor</TableHead>
              <TableHead className="text-right font-semibold">Total Efetivado</TableHead>
              <TableHead className="text-right font-semibold">Comissão</TableHead>
              <TableHead className="text-right font-semibold">Saldo Final</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Wallet className="h-8 w-8 opacity-20" />
                    <p>Nenhum relatório gerado ainda.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {report.referenceMonth}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{getPrescriberName(report.prescriberId)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(report.totalEffectiveValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(report.commissionValue)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(report.finalBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 rounded-lg hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                        onClick={() => onDownload(report.id)}
                        data-testid={`button-download-pdf-${report.id}`}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
                        onClick={() => setReportToDelete(report.id)}
                        data-testid={`button-delete-report-${report.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={reportToDelete !== null} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Relatório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O relatório será deletado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel disabled={isDeleting} data-testid="button-cancel-delete">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => reportToDelete && handleDelete(reportToDelete)}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {isDeleting ? "Deletando..." : "Deletar"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
