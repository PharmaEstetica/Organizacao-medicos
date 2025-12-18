import { useState } from "react";
import { usePackagings, useCreatePackaging, useDeletePackaging } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Trash2, Plus, Image as ImageIcon, Upload } from "lucide-react";
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
  type: z.string().min(2, "Tipo é obrigatório"),
  capacity: z.string().min(1, "Capacidade é obrigatória"),
  imageUrl: z.string().optional(),
  hasSticker: z.boolean().default(false),
  stickerSupplier: z.string().optional(),
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
  const createPackaging = useCreatePackaging();
  const deletePackaging = useDeletePackaging();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof packagingSchema>>({
    resolver: zodResolver(packagingSchema),
    defaultValues: {
      name: "",
      type: "",
      capacity: "",
      hasSticker: false,
      stickerSupplier: "",
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof packagingSchema>) => {
    createPackaging.mutate({
        ...values,
        imageUrl: imagePreview || values.imageUrl,
    }, {
      onSuccess: () => {
        form.reset();
        setImagePreview(null);
        setIsOpen(false);
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Embalagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Embalagem</DialogTitle>
              <DialogDescription>Adicione uma nova opção de embalagem.</DialogDescription>
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
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Pote" {...field} />
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

                <div className="flex justify-end pt-4">
                    <Button type="submit">Salvar Embalagem</Button>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Adesivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {packagings.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => deletePackaging.mutate(pkg.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
