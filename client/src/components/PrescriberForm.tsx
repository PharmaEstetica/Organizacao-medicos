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
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Prescriber } from "@/types";
import { User, Stethoscope, FileBadge, Percent, Package, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  specialty: z.string().min(2, "Especialidade obrigatória"),
  crm: z.string().optional(),
  crm_required: z.boolean().default(true),
  commission_percentage: z.coerce.number().min(0).max(100),
  bond_type: z.enum(["P", "C", "N"], {
    required_error: "Selecione o tipo de vínculo",
  }),
  linked_packagings: z.array(z.number()).default([]),
});

interface PrescriberFormProps {
  onSuccess?: () => void;
  initialData?: Prescriber;
}

export function PrescriberForm({ onSuccess, initialData }: PrescriberFormProps) {
  const { addPrescriber, updatePrescriber, packagings } = useApp();
  const { toast } = useToast();
  const [openPackagings, setOpenPackagings] = useState(false);

  const defaultValues: Partial<z.infer<typeof formSchema>> = initialData ? {
    name: initialData.name,
    specialty: initialData.specialty,
    crm: initialData.crm || "",
    crm_required: initialData.crm_required,
    commission_percentage: initialData.commission_percentage,
    bond_type: initialData.bond_type,
    linked_packagings: initialData.linked_packagings || [],
  } : {
    name: "",
    specialty: "",
    crm: "",
    crm_required: true,
    commission_percentage: 10,
    bond_type: "P",
    linked_packagings: [],
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const prescriberData = {
        ...values,
        crm: values.crm || null,
        packagings_count: values.linked_packagings.length,
      };

      if (initialData) {
        updatePrescriber(initialData.id, prescriberData);
        toast({
          title: "Prescritor atualizado",
          description: `${values.name} foi atualizado com sucesso.`,
        });
      } else {
        addPrescriber(prescriberData);
        toast({
          title: "Prescritor cadastrado",
          description: `${values.name} foi adicionado com sucesso.`,
        });
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar.",
        variant: "destructive",
      });
    }
  }

  const selectedPackagings = form.watch("linked_packagings");

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
            name="bond_type"
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
            name="linked_packagings"
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
            name="commission_percentage"
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
          name="crm_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-sm border border-border p-4 bg-muted/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
