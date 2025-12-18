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
