import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { type Prescriber as ApiPrescriber } from "@/lib/api";
import { usePackagings, useCreatePrescriber, useUpdatePrescriber } from "@/hooks/useApi";
import { User, Stethoscope, FileBadge, Percent, Package, Check, ChevronsUpDown, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  specialty: z.string().min(2, "Especialidade obrigatória"),
  crm: z.string().optional(),
  crmRequired: z.boolean().default(true),
  commissionPercentage: z.coerce.number().min(0).max(100),
  bondType: z.enum(["P", "C", "N"], {
    required_error: "Selecione o tipo de vínculo",
  }),
  linkedPackagings: z.array(z.number()).default([]),
  photoUrl: z.string().optional(),
});

interface PrescriberFormProps {
  onSuccess?: () => void;
  initialData?: ApiPrescriber;
}

export function PrescriberForm({ onSuccess, initialData }: PrescriberFormProps) {
  const { toast } = useToast();
  const [openPackagings, setOpenPackagings] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
  
  const { data: packagings = [] } = usePackagings();
  const createPrescriber = useCreatePrescriber();
  const updatePrescriber = useUpdatePrescriber();

  const defaultValues: Partial<z.infer<typeof formSchema>> = initialData ? {
    name: initialData.name,
    specialty: initialData.specialty,
    crm: initialData.crm || "",
    crmRequired: initialData.crmRequired,
    commissionPercentage: parseFloat(initialData.commissionPercentage),
    bondType: initialData.bondType as "P" | "C" | "N",
    linkedPackagings: initialData.linkedPackagings || [],
    photoUrl: initialData.photoUrl || "",
  } : {
    name: "",
    specialty: "",
    crm: "",
    crmRequired: true,
    commissionPercentage: 10,
    bondType: "P" as const,
    linkedPackagings: [],
    photoUrl: "",
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPhotoPreview(base64String);
      form.setValue("photoUrl", base64String);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue("photoUrl", "");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const prescriberData = {
      ...values,
      crm: values.crm || null,
      commissionPercentage: values.commissionPercentage.toString(),
    };

    if (initialData) {
      updatePrescriber.mutate(
        { id: initialData.id, data: prescriberData },
        {
          onSuccess: () => {
            toast({
              title: "Prescritor atualizado",
              description: `${values.name} foi atualizado com sucesso.`,
            });
            form.reset();
            onSuccess?.();
          },
          onError: () => {
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao atualizar.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createPrescriber.mutate(prescriberData, {
        onSuccess: () => {
          toast({
            title: "Prescritor cadastrado",
            description: `${values.name} foi adicionado com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao salvar.",
            variant: "destructive",
          });
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Fulano de Tal" {...field} className="rounded-sm border-border bg-muted/20 focus:bg-background h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Foto do Prescritor</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="h-24 w-24 rounded-sm object-cover border border-border"
                        data-testid="photo-preview"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        data-testid="button-remove-photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-sm bg-muted flex items-center justify-center border border-dashed border-border">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-input"
                      data-testid="input-photo"
                    />
                    <label
                      htmlFor="photo-input"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Selecionar Foto</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou WebP. Máx 5MB</p>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Especialidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Cardiologia" {...field} className="rounded-sm border-border bg-muted/20 focus:bg-background h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bondType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Tipo de Vínculo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-sm border-border bg-muted/20 focus:bg-background h-11">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="P">P</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="linkedPackagings"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Embalagens Vinculadas</FormLabel>
                <Popover open={openPackagings} onOpenChange={setOpenPackagings}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between h-auto min-h-[44px] py-2 px-3 rounded-sm border-border bg-muted/20 focus:bg-background hover:bg-muted/30 font-normal text-left",
                          !field.value?.length && "text-muted-foreground"
                        )}
                      >
                        {field.value?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {field.value.map((id) => {
                                const pkg = packagings.find(p => p.id === id);
                                return pkg ? (
                                    <Badge key={id} variant="secondary" className="mr-1 mb-1">
                                        {pkg.name} ({pkg.capacity})
                                    </Badge>
                                ) : null;
                            })}
                          </div>
                        ) : (
                          "Selecione as embalagens..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar embalagem..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma embalagem encontrada.</CommandEmpty>
                        <CommandGroup>
                          {packagings.map((pkg) => (
                            <CommandItem
                              value={pkg.name}
                              key={pkg.id}
                              onSelect={() => {
                                const current = field.value || [];
                                const isSelected = current.includes(pkg.id);
                                if (isSelected) {
                                  field.onChange(current.filter((id) => id !== pkg.id));
                                } else {
                                  field.onChange([...current, pkg.id]);
                                }
                              }}
                            >
                              <div className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                (field.value || []).includes(pkg.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}>
                                <Check className={cn("h-4 w-4")} />
                              </div>
                              {pkg.name} <span className="text-muted-foreground ml-1">({pkg.capacity})</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="crm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">CRM</FormLabel>
                <FormControl>
                  <Input placeholder="12345/UF" {...field} className="rounded-sm border-border bg-muted/20 focus:bg-background h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commissionPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">%</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} className="rounded-sm border-border bg-muted/20 focus:bg-background h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="crmRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-sm border border-border p-4 bg-muted/10">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  className="rounded-xs mt-0.5"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  Exigir CRM nos relatórios
                </FormLabel>
                <FormDescription>
                  Validação estrita do CRM durante o processamento.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="rounded-sm px-8 font-semibold">
            {initialData ? "Salvar Alterações" : "Cadastrar Prescritor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
