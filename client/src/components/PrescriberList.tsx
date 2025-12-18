import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface PrescriberListProps {
  onEdit: (id: number) => void;
}

export function PrescriberList({ onEdit }: PrescriberListProps) {
  const { prescribers, deletePrescriber } = useApp();

  const getBondLabel = (type: string) => {
    switch (type) {
      case 'P': return 'Parceiro';
      case 'C': return 'Comissionado';
      case 'N': return 'Nenhum';
      default: return type;
    }
  };

  const getBondColor = (type: string) => {
    switch (type) {
      case 'P': return 'default'; // primary
      case 'C': return 'secondary';
      case 'N': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead>Vínculo</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prescribers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum prescritor cadastrado.
              </TableCell>
            </TableRow>
          ) : (
            prescribers.map((prescriber) => (
              <TableRow key={prescriber.id}>
                <TableCell className="font-medium">{prescriber.name}</TableCell>
                <TableCell>{prescriber.specialty}</TableCell>
                <TableCell>
                  <Badge variant={getBondColor(prescriber.bond_type) as any}>
                    {getBondLabel(prescriber.bond_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{prescriber.commission_percentage}%</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(prescriber.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o prescritor
                            e seus dados associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePrescriber(prescriber.id)} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
