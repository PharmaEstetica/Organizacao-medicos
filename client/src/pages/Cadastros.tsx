import { useState } from "react";
import { PrescriberForm } from "@/components/PrescriberForm";
import { PrescriberList } from "@/components/PrescriberList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";

export default function Cadastros() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { prescribers } = useApp();

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const editingPrescriber = prescribers.find((p) => p.id === editingId);

  return (
    <div className="container py-10 max-w-screen-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescritores</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o cadastro de médicos e parceiros.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingId(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prescritor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Prescritor" : "Novo Prescritor"}</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para {editingId ? "editar" : "cadastrar"} um prescritor.
              </DialogDescription>
            </DialogHeader>
            <PrescriberForm onSuccess={handleSuccess} initialData={editingPrescriber} />
          </DialogContent>
        </Dialog>
      </div>

      <PrescriberList onEdit={handleEdit} />
    </div>
  );
}
