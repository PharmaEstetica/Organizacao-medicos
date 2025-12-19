import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, User, Stethoscope } from "lucide-react";
import { usePrescribers, useDeletePrescriber } from "@/hooks/useApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PasswordModal } from "@/components/PasswordModal";
import { useToast } from "@/hooks/use-toast";

interface PrescriberListProps {
  onEdit: (id: number) => void;
}

export function PrescriberList({ onEdit }: PrescriberListProps) {
  const { data: prescribers = [] } = usePrescribers();
  const deletePrescriber = useDeletePrescriber();
  const { toast } = useToast();
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleteProtected, setIsDeleteProtected] = useState(true);
  const [deleteUnlocked, setDeleteUnlocked] = useState(false);

  useEffect(() => {
    const checkProtection = async () => {
      try {
        const res = await fetch('/api/settings/is-protected/delete');
        const data = await res.json();
        setIsDeleteProtected(data.isProtected);
      } catch {
        setIsDeleteProtected(true);
      }
    };
    
    const unlocked = sessionStorage.getItem('unlocked_delete') === 'true';
    if (unlocked) {
      setDeleteUnlocked(true);
    }
    
    checkProtection();
  }, []);

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    
    if (isDeleteProtected && !deleteUnlocked) {
      setShowPasswordModal(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: 'delete', password })
      });
      
      if (res.ok) {
        setDeleteUnlocked(true);
        sessionStorage.setItem('unlocked_delete', 'true');
        setShowPasswordModal(false);
        setShowConfirmDialog(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deletePrescriber.mutate(deleteId);
      toast({
        title: "Excluído",
        description: "Prescritor excluído com sucesso.",
      });
    }
    setShowConfirmDialog(false);
    setDeleteId(null);
  };

  const prescriberToDelete = prescribers.find(p => p.id === deleteId);

  const getBondLabel = (type: string) => {
    return type;
  };

  return (
    <>
      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="h-12 font-bold text-xs uppercase tracking-wider text-muted-foreground">Nome</TableHead>
              <TableHead className="h-12 font-bold text-xs uppercase tracking-wider text-muted-foreground">Especialidade</TableHead>
              <TableHead className="h-12 font-bold text-xs uppercase tracking-wider text-muted-foreground">Vínculo</TableHead>
              <TableHead className="h-12 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">%</TableHead>
              <TableHead className="h-12 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
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
                <TableRow key={prescriber.id} className="group hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="font-medium text-foreground py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {prescriber.name.charAt(0)}
                      </div>
                      <span className="font-semibold">{prescriber.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {prescriber.specialty}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-sm font-medium border-border text-muted-foreground px-2 py-0.5 text-xs">
                      {getBondLabel(prescriber.bondType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm font-medium">
                      {prescriber.commissionPercentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm hover:text-primary hover:bg-primary/5"
                        onClick={() => onEdit(prescriber.id)}
                        data-testid={`button-edit-prescriber-${prescriber.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(prescriber.id)}
                        data-testid={`button-delete-prescriber-${prescriber.id}`}
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

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setDeleteId(null);
        }}
        onVerify={handlePasswordVerify}
        title="Digite a senha para excluir este cadastro"
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente o cadastro de <strong>{prescriberToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-sm"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
