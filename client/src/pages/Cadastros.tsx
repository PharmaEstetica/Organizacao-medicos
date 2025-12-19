import { useState } from "react";
import { PrescriberForm } from "@/components/PrescriberForm";
import { PrescriberList } from "@/components/PrescriberList";
import { PackagingManager } from "@/components/PackagingManager";
import { Button } from "@/components/ui/button";
import { Plus, Users, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrescribers } from "@/hooks/useApi";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "@/components/PasswordModal";

export default function Cadastros() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { data: prescribers = [] } = usePrescribers();
  const { isLocked, verifyPassword } = useProtectedAccess('criar_prescritor');

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsDialogOpen(true);
  };

  const handleNewPrescriber = () => {
    if (isLocked) {
      setShowPasswordModal(true);
    } else {
      setEditingId(null);
      setIsDialogOpen(true);
    }
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success) {
      setShowPasswordModal(false);
      setEditingId(null);
      setIsDialogOpen(true);
    }
    return success;
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
          <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie prescritores e embalagens do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="prescritores" className="space-y-6">
        <TabsList>
            <TabsTrigger value="prescritores" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Prescritores
            </TabsTrigger>
            <TabsTrigger value="embalagens" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Embalagens
            </TabsTrigger>
        </TabsList>

        <TabsContent value="prescritores" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-end">
                <Button onClick={handleNewPrescriber}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Prescritor
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingId(null);
                }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
        </TabsContent>

        <TabsContent value="embalagens" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PackagingManager />
        </TabsContent>
      </Tabs>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerify={handlePasswordVerify}
        title="Digite a senha para criar um novo prescritor."
      />
    </div>
  );
}
