import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, User, Stethoscope, Percent } from "lucide-react";
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

  const getBondVariant = (type: string) => {
    switch (type) {
      case 'P': return 'default'; // primary
      case 'C': return 'secondary'; // secondary
      case 'N': return 'outline'; // outline
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-foreground/70">Nome</TableHead>
            <TableHead className="font-semibold text-foreground/70">Especialidade</TableHead>
            <TableHead className="font-semibold text-foreground/70">Vínculo</TableHead>
            <TableHead className="text-right font-semibold text-foreground/70">Comissão</TableHead>
            <TableHead className="text-right font-semibold text-foreground/70">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prescribers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <User className="h-8 w-8 opacity-20" />
                  <p>Nenhum prescritor cadastrado.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            prescribers.map((prescriber) => (
              <TableRow key={prescriber.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {prescriber.name.charAt(0)}
                    </div>
                    {prescriber.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="h-3 w-3" />
                    {prescriber.specialty}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBondVariant(prescriber.bond_type) as any} className="rounded-md font-medium px-2.5 py-0.5">
                    {getBondLabel(prescriber.bond_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 font-mono text-sm">
                    {prescriber.commission_percentage}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                      onClick={() => onEdit(prescriber.id)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação excluirá permanentemente o cadastro de <strong>{prescriber.name}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deletePrescriber(prescriber.id)} 
                            className="bg-destructive hover:bg-destructive/90 rounded-xl"
                          >
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
