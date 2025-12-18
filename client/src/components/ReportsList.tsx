import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportsListProps {
  onDownload: (reportId: number) => void;
}

export function ReportsList({ onDownload }: ReportsListProps) {
  const { reports, prescribers } = useApp();

  const getPrescriberName = (id: number) => {
    return prescribers.find(p => p.id === id)?.name || "Desconhecido";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
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
                    {report.reference_month}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">{getPrescriberName(report.prescriber_id)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(report.total_effective_value)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(report.commission_value)}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.final_balance)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 rounded-lg hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                    onClick={() => onDownload(report.id)}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
