import { useState } from "react";
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
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formulaSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  prescriberId: z.string(), // We'll handle 'none' as a string value "none" or empty
  pharmaceuticalForm: z.string().min(1, "Forma farmacêutica é obrigatória"),
  content: z.string().min(10, "A fórmula deve ter pelo menos 10 caracteres"),
});

interface FormulaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormulaForm({ open, onOpenChange }: FormulaFormProps) {
  const { prescribers, addFormula, pharmaceuticalForms, addPharmaceuticalForm } = useApp();
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<z.infer<typeof formulaSchema>>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: "",
      prescriberId: "none",
      pharmaceuticalForm: "",
      content: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formulaSchema>) => {
    // Add pharma form if it doesn't exist (handled by the combobox creation logic effectively, but good to ensure)
    addPharmaceuticalForm(values.pharmaceuticalForm);

    addFormula({
      name: values.name,
      prescriberId: values.prescriberId === "none" ? null : parseInt(values.prescriberId),
      content: values.content,
      pharmaceuticalForm: values.pharmaceuticalForm,
    });

    toast({
      title: "Fórmula criada",
      description: "A nova fórmula foi salva com sucesso.",
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Fórmula</DialogTitle>
          <DialogDescription>
            Cadastre uma nova fórmula farmacêutica.
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prescriberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parceiro Vinculado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {prescribers.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
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
                                        // This handles the "create new" case crudely but effectively for a prototype
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
                                  value={item}
                                  key={item}
                                  onSelect={() => {
                                    field.onChange(item);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      item === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {item}
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
            </div>

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
              <Button type="submit">Salvar Fórmula</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
