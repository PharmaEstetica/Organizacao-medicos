import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { usePrescribers, usePackagings, useCreateFormula, useUpdateFormula, usePharmaceuticalForms, useCreatePharmaceuticalForm, useSetFormulaPrescribers } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Formula, Prescriber } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formulaSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  packagingId: z.string(),
  pharmaceuticalForm: z.string().min(1, "Forma farmacêutica é obrigatória"),
  content: z.string().min(10, "A fórmula deve ter pelo menos 10 caracteres"),
});

interface FormulaWithPrescribers extends Formula {
  prescribers?: Prescriber[];
}

interface FormulaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFormula?: FormulaWithPrescribers | null;
  onEditComplete?: () => void;
}

export function FormulaForm({ open, onOpenChange, editingFormula, onEditComplete }: FormulaFormProps) {
  const { data: prescribers = [] } = usePrescribers();
  const { data: packagings = [] } = usePackagings();
  const { data: pharmaceuticalForms = [] } = usePharmaceuticalForms();
  const createFormula = useCreateFormula();
  const updateFormula = useUpdateFormula();
  const createPharmaceuticalForm = useCreatePharmaceuticalForm();
  const setFormulaPrescribers = useSetFormulaPrescribers();
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedPrescriberIds, setSelectedPrescriberIds] = useState<number[]>([]);

  const isEditing = !!editingFormula;

  const form = useForm<z.infer<typeof formulaSchema>>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: "",
      packagingId: "none",
      pharmaceuticalForm: "",
      content: "",
    },
  });

  useEffect(() => {
    if (editingFormula) {
      form.reset({
        name: editingFormula.name,
        packagingId: editingFormula.packagingId?.toString() || "none",
        pharmaceuticalForm: editingFormula.pharmaceuticalForm,
        content: editingFormula.content,
      });
      setSelectedPrescriberIds(editingFormula.prescribers?.map(p => p.id) || []);
    } else {
      form.reset({
        name: "",
        packagingId: "none",
        pharmaceuticalForm: "",
        content: "",
      });
      setSelectedPrescriberIds([]);
    }
  }, [editingFormula, form]);

  const handleClose = () => {
    form.reset();
    setSelectedPrescriberIds([]);
    onOpenChange(false);
    if (onEditComplete) onEditComplete();
  };

  const togglePrescriber = (id: number) => {
    setSelectedPrescriberIds(prev => 
      prev.includes(id) 
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  const onSubmit = async (values: z.infer<typeof formulaSchema>) => {
    if (!pharmaceuticalForms.find(f => f.name === values.pharmaceuticalForm)) {
      createPharmaceuticalForm.mutate(values.pharmaceuticalForm);
    }

    const formulaData = {
      name: values.name,
      prescriberId: null,
      packagingId: values.packagingId === "none" ? null : parseInt(values.packagingId),
      content: values.content,
      pharmaceuticalForm: values.pharmaceuticalForm,
    };

    if (isEditing && editingFormula) {
      updateFormula.mutate({ id: editingFormula.id, data: formulaData }, {
        onSuccess: () => {
          setFormulaPrescribers.mutate({ id: editingFormula.id, prescriberIds: selectedPrescriberIds }, {
            onSuccess: () => {
              toast({
                title: "Fórmula atualizada",
                description: "As alterações foram salvas com sucesso.",
              });
              handleClose();
            },
            onError: (error) => {
              toast({
                title: "Erro ao vincular médicos",
                description: "A fórmula foi atualizada, mas houve um erro ao vincular os médicos.",
                variant: "destructive",
              });
            }
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar fórmula",
            description: "Não foi possível salvar as alterações.",
            variant: "destructive",
          });
        }
      });
    } else {
      createFormula.mutate(formulaData, {
        onSuccess: (newFormula) => {
          if (selectedPrescriberIds.length > 0 && newFormula?.id) {
            setFormulaPrescribers.mutate({ id: newFormula.id, prescriberIds: selectedPrescriberIds }, {
              onError: (error) => {
                toast({
                  title: "Aviso",
                  description: "Fórmula criada, mas houve um erro ao vincular os médicos.",
                  variant: "destructive",
                });
              }
            });
          }
          toast({
            title: "Fórmula criada",
            description: "A nova fórmula foi salva com sucesso.",
          });
          handleClose();
        },
        onError: (error) => {
          toast({
            title: "Erro ao criar fórmula",
            description: "Não foi possível salvar a fórmula.",
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fórmula" : "Nova Fórmula"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edite os dados da fórmula farmacêutica." : "Cadastre uma nova fórmula farmacêutica."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Fórmula</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Anti-Aging Plus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Médicos Vinculados</FormLabel>
              <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto">
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
                        <span className="text-xs text-muted-foreground ml-auto">({p.commissionPercentage}%)</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedPrescriberIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPrescriberIds.map(id => {
                    const p = prescribers.find(pr => pr.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {p.name}
                        <button type="button" onClick={() => togglePrescriber(id)} className="hover:bg-primary/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="packagingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embalagem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {packagings.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} ({p.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pharmaceuticalForm"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Forma Farmacêutica</FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Selecione ou digite..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Buscar ou criar..." />
                        <CommandList>
                          <CommandEmpty>
                              <div 
                                  className="p-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                      const inputValue = document.querySelector('[cmdk-input]')?.getAttribute('value');
                                      if (inputValue) {
                                          field.onChange(inputValue);
                                          setOpenCombobox(false);
                                      }
                                  }}
                              >
                                  Criar nova forma
                              </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {pharmaceuticalForms.map((item) => (
                              <CommandItem
                                value={item.name}
                                key={item.id}
                                onSelect={() => {
                                  field.onChange(item.name);
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.name === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {item.name}
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fórmula Completa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite os componentes e quantidades..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit">{isEditing ? "Salvar Alterações" : "Salvar Fórmula"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
