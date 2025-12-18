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
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Prescriber } from "@/types";
import { User, Stethoscope, FileBadge, Percent } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  specialty: z.string().min(2, "Especialidade obrigatória"),
  crm: z.string().optional(),
  crm_required: z.boolean().default(true),
  commission_percentage: z.coerce.number().min(0).max(100),
  bond_type: z.enum(["P", "C", "N"], {
    required_error: "Selecione o tipo de vínculo",
  }),
});

interface PrescriberFormProps {
  onSuccess?: () => void;
  initialData?: Prescriber;
}

export function PrescriberForm({ onSuccess, initialData }: PrescriberFormProps) {
  const { addPrescriber, updatePrescriber } = useApp();
  const { toast } = useToast();

  const defaultValues: Partial<z.infer<typeof formSchema>> = initialData ? {
    name: initialData.name,
    specialty: initialData.specialty,
    crm: initialData.crm || "",
    crm_required: initialData.crm_required,
    commission_percentage: initialData.commission_percentage,
    bond_type: initialData.bond_type,
  } : {
    name: "",
    specialty: "",
    crm: "",
    crm_required: true,
    commission_percentage: 10,
    bond_type: "P",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Dr. Fulano de Tal" {...field} className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors" />
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
                <FormLabel>Especialidade</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ex: Cardiologia" {...field} className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors" />
                  </div>
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
                <FormLabel>Tipo de Vínculo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="P">Parceiro (P)</SelectItem>
                    <SelectItem value="C">Comissionado (C)</SelectItem>
                    <SelectItem value="N">Nenhum (N)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="crm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CRM</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileBadge className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="12345/UF" {...field} className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors" />
                  </div>
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
                <FormLabel>Comissão (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.1" {...field} className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors" />
                  </div>
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium">
                  Exigir CRM nos relatórios
                </FormLabel>
                <FormDescription>
                  Se marcado, o sistema validará o CRM deste prescritor durante o processamento.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
            {initialData ? "Salvar Alterações" : "Cadastrar Prescritor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
