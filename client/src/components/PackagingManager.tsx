import { useState, useEffect } from "react";
import { usePackagings, useCreatePackaging, useDeletePackaging, useUpdatePackaging, usePrescribers, useSetPackagingPrescribers, usePackagingsWithPrescribers } from "@/hooks/useApi";
import heic2any from "heic2any";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Trash2, Plus, Image as ImageIcon, Upload, Edit2, Users, Loader2 } from "lucide-react";
import { useProtectedAccess } from "@/hooks/useProtectedAccess";
import { PasswordModal } from "./PasswordModal";
import type { Packaging } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const packagingSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  type: z.string().min(2, "Fórmula farmacêutica é obrigatória"),
  capacity: z.string().min(1, "Capacidade é obrigatória"),
  imageUrl: z.string().optional(),
  hasSticker: z.boolean().default(false),
  stickerSupplier: z.string().optional(),
  labelSpecifications: z.string().optional(),
}).refine((data) => {
  if (data.hasSticker && !data.stickerSupplier) {
    return false;
  }
  return true;
}, {
  message: "Fornecedor é obrigatório se tiver adesivo",
  path: ["stickerSupplier"],
});

export function PackagingManager() {
  const { data: packagings = [] } = usePackagings();
  const { data: packagingsWithPrescribers = [], isLoading: isLoadingPackagingsWithPrescribers } = usePackagingsWithPrescribers();
  const { data: prescribers = [] } = usePrescribers();
  const createPackaging = useCreatePackaging();
  const deletePackaging = useDeletePackaging();
  const updatePackaging = useUpdatePackaging();
  const setPackagingPrescribers = useSetPackagingPrescribers();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [selectedPrescriberIds, setSelectedPrescriberIds] = useState<number[]>([]);
  const [prescribersLoaded, setPrescribersLoaded] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit'; id: number } | null>(null);
  const { isLocked, verifyPassword, showPasswordModal: protectedModalOpen, setShowPasswordModal: setProtectedModalOpen } = useProtectedAccess('excluir');

  const togglePrescriber = (id: number) => {
    setSelectedPrescriberIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getPackagingPrescriberCount = (packagingId: number) => {
    const packaging = packagingsWithPrescribers.find((p: any) => p.id === packagingId);
    return packaging?.prescribers?.length || 0;
  };

  const form = useForm<z.infer<typeof packagingSchema>>({
    resolver: zodResolver(packagingSchema),
    defaultValues: {
      name: "",
      type: "",
      capacity: "",
      hasSticker: false,
      stickerSupplier: "",
      imageUrl: "",
      labelSpecifications: "",
    },
  });

  const onSubmit = (values: z.infer<typeof packagingSchema>) => {
    if (editingPackaging && !prescribersLoaded) {
      toast({
        title: "Aguarde",
        description: "Os dados ainda estão carregando. Por favor, aguarde.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...values,
      imageUrl: imagePreview || values.imageUrl,
    };
    
    if (editingPackaging) {
      updatePackaging.mutate({ id: editingPackaging.id, data }, {
        onSuccess: () => {
          setPackagingPrescribers.mutate({ id: editingPackaging.id, prescriberIds: selectedPrescriberIds }, {
            onSuccess: () => {
              toast({
                title: "Embalagem atualizada",
                description: "As alterações foram salvas com sucesso.",
              });
              form.reset();
              setImagePreview(null);
              setEditingPackaging(null);
              setSelectedPrescriberIds([]);
              setPrescribersLoaded(false);
              setIsOpen(false);
            },
            onError: () => {
              toast({
                title: "Erro ao vincular médicos",
                description: "A embalagem foi atualizada, mas houve um erro ao vincular os médicos. Tente novamente.",
                variant: "destructive",
              });
            }
          });
        },
        onError: () => {
          toast({
            title: "Erro ao atualizar",
            description: "Não foi possível salvar as alterações.",
            variant: "destructive",
          });
        }
      });
    } else {
      createPackaging.mutate(data, {
        onSuccess: (newPackaging) => {
          if (selectedPrescriberIds.length > 0 && newPackaging?.id) {
            setPackagingPrescribers.mutate({ id: newPackaging.id, prescriberIds: selectedPrescriberIds }, {
              onError: () => {
                toast({
                  title: "Aviso",
                  description: "Embalagem criada, mas houve um erro ao vincular os médicos.",
                  variant: "destructive",
                });
              }
            });
          }
          toast({
            title: "Embalagem criada",
            description: "A nova embalagem foi salva com sucesso.",
          });
          form.reset();
          setImagePreview(null);
          setSelectedPrescriberIds([]);
          setPrescribersLoaded(false);
          setIsOpen(false);
        },
        onError: () => {
          toast({
            title: "Erro ao criar",
            description: "Não foi possível salvar a embalagem.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEditClick = (pkg: Packaging) => {
    if (!isLocked) {
      openEditDialog(pkg);
    } else {
      setPendingAction({ type: 'edit', id: pkg.id });
      setShowPasswordModal(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    if (!isLocked) {
      deletePackaging.mutate(id);
    } else {
      setPendingAction({ type: 'delete', id });
      setShowPasswordModal(true);
    }
  };

  const openEditDialog = (pkg: Packaging) => {
    setEditingPackaging(pkg);
    setImagePreview(pkg.imageUrl || null);
    form.reset({
      name: pkg.name,
      type: pkg.type,
      capacity: pkg.capacity,
      hasSticker: pkg.hasSticker,
      stickerSupplier: pkg.stickerSupplier || "",
      imageUrl: pkg.imageUrl || "",
      labelSpecifications: (pkg as any).labelSpecifications || "",
    });
    const packagingWithPrescribersData = packagingsWithPrescribers.find((p: any) => p.id === pkg.id);
    if (packagingWithPrescribersData) {
      const existingPrescriberIds = packagingWithPrescribersData.prescribers?.map((p: any) => p.id) || [];
      setSelectedPrescriberIds(existingPrescriberIds);
      setPrescribersLoaded(true);
    } else if (!isLoadingPackagingsWithPrescribers) {
      setSelectedPrescriberIds([]);
      setPrescribersLoaded(true);
    } else {
      setPrescribersLoaded(false);
    }
    setIsOpen(true);
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    const success = await verifyPassword(password);
    if (success && pendingAction) {
      setShowPasswordModal(false);
      if (pendingAction.type === 'delete') {
        deletePackaging.mutate(pendingAction.id);
      } else if (pendingAction.type === 'edit') {
        const pkg = packagings.find(p => p.id === pendingAction.id);
        if (pkg) openEditDialog(pkg);
      }
      setPendingAction(null);
    }
    return success;
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setImagePreview(null);
      setEditingPackaging(null);
      setSelectedPrescriberIds([]);
      setPrescribersLoaded(false);
    }
    setIsOpen(open);
  };

  useEffect(() => {
    if (editingPackaging && !isLoadingPackagingsWithPrescribers && !prescribersLoaded) {
      const packagingWithPrescribersData = packagingsWithPrescribers.find((p: any) => p.id === editingPackaging.id);
      if (packagingWithPrescribersData) {
        const existingPrescriberIds = packagingWithPrescribersData.prescribers?.map((p: any) => p.id) || [];
        setSelectedPrescriberIds(existingPrescriberIds);
      }
      setPrescribersLoaded(true);
    }
  }, [editingPackaging, packagingsWithPrescribers, isLoadingPackagingsWithPrescribers, prescribersLoaded]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        let processedFile = file;
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                       file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
          const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          });
          const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
          processedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' });
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Embalagens Cadastradas
          </h2>
          <p className="text-muted-foreground text-sm">Gerencie o estoque de embalagens disponíveis.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPackaging(null); form.reset(); setImagePreview(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Embalagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackaging ? 'Editar Embalagem' : 'Cadastrar Embalagem'}</DialogTitle>
              <DialogDescription>{editingPackaging ? 'Atualize as informações da embalagem.' : 'Adicione uma nova opção de embalagem.'}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                
                {/* Image Upload Area */}
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:bg-muted/50 transition-colors overflow-hidden">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleImageChange}
                        />
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Clique para adicionar foto</span>
                                <span className="text-xs text-muted-foreground/70 mt-1">PNG, JPG até 5MB</span>
                            </>
                        )}
                        {imagePreview && (
                            <div className="absolute top-2 right-2 z-20">
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImagePreview(null);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pote Luxo Branco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fórmula Farmacêutica</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Creme Facial, Cápsula, Gel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 30g" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="labelSpecifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificações do Rótulo (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Formulações específicas, instruções de uso, informações adicionais para o rótulo..." 
                          className="min-h-[80px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/20 p-4 rounded-lg border border-border space-y-4">
                    <FormField
                    control={form.control}
                    name="hasSticker"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg p-0">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-semibold">
                                    Requer Adesivo?
                                </FormLabel>
                                <FormDescription>
                                    Marque se esta embalagem precisa de personalização.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />

                    {form.watch("hasSticker") && (
                        <FormField
                            control={form.control}
                            name="stickerSupplier"
                            render={({ field }) => (
                            <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <FormLabel>Fornecedor do Adesivo</FormLabel>
                                <FormControl>
                                <Input placeholder="Ex: Gráfica Central" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Médicos Vinculados
                  </Label>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                    {prescribers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum médico cadastrado</p>
                    ) : (
                      <div className="space-y-2">
                        {prescribers.map(p => (
                          <label 
                            key={p.id} 
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                          >
                            <Checkbox 
                              checked={selectedPrescriberIds.includes(p.id)}
                              onCheckedChange={() => togglePrescriber(p.id)}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={p.photoUrl || undefined} />
                              <AvatarFallback className="text-[10px]">{p.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{p.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{p.specialty}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPrescriberIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPrescriberIds.length} médico{selectedPrescriberIds.length > 1 ? 's' : ''} selecionado{selectedPrescriberIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={editingPackaging && !prescribersLoaded}
                    >
                      {editingPackaging && !prescribersLoaded ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        editingPackaging ? 'Atualizar' : 'Salvar Embalagem'
                      )}
                    </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Fórm. Farmacêutica</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Adesivo</TableHead>
                    <TableHead>Médicos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {packagings.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma embalagem cadastrada.
                        </TableCell>
                    </TableRow>
                ) : (
                    packagings.map((pkg) => (
                        <TableRow key={pkg.id}>
                            <TableCell>
                                {pkg.imageUrl ? (
                                    <div className="h-10 w-10 rounded-sm overflow-hidden bg-muted border border-border">
                                        <img src={pkg.imageUrl} alt={pkg.name} className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-5 w-5 opacity-50" />
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="font-medium">{pkg.name}</TableCell>
                            <TableCell>{pkg.type}</TableCell>
                            <TableCell>{pkg.capacity}</TableCell>
                            <TableCell>
                                {pkg.hasSticker ? (
                                    <div className="flex flex-col">
                                        <Badge variant="outline" className="w-fit mb-1 border-primary/30 text-primary bg-primary/5">Sim</Badge>
                                        <span className="text-xs text-muted-foreground">{pkg.stickerSupplier}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {getPackagingPrescriberCount(pkg.id) > 0 ? (
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">{getPackagingPrescriberCount(pkg.id)}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(pkg)}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pkg.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
        onClose={() => { setShowPasswordModal(false); setPendingAction(null); }}
        onVerify={handlePasswordVerify}
        title="Digite a senha para realizar esta operação."
      />
    </div>
  );
}
