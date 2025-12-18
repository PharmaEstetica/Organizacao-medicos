import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper to download the generated PDF
// In a real app, this would be a link to the backend generated file
// Since we are mocking PDF generation in frontend (for now it's just stored in state),
// we will just show a "Download" button that doesn't actually download a file from server
// but in the next step I will implement client-side PDF generation.
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês Referência</TableHead>
            <TableHead>Prescritor</TableHead>
            <TableHead className="text-right">Total Efetivado</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead className="text-right">Saldo Final</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Nenhum relatório gerado.
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium capitalize">
                  {report.reference_month}
                </TableCell>
                <TableCell>{getPrescriberName(report.prescriber_id)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(report.total_effective_value)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(report.commission_value)}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(report.final_balance)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(report.id)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
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
