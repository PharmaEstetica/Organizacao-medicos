import { useState } from "react";
import { CSVUpload } from "@/components/CSVUpload";
import { MonthlyOrders } from "@/components/MonthlyOrders";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, ShoppingBag } from "lucide-react";
import { useApp } from "@/context/AppContext";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { GroupedOrder } from "@/types";

const formSchema = z.object({
  prescriberName: z.string().min(1, "Selecione um parceiro"),
  orderDate: z.string().min(1, "Data é obrigatória"),
  req: z.string().min(1, "REQ é obrigatório"),
  discountPercentage: z.coerce.number().min(0).max(100),
  netValue: z.coerce.number().min(0),
  paymentStatus: z.enum(["Pago", "Pendente"]),
});

export default function PedidosDoMes() {
  const { clearOrders, orders, prescribers, addOrders } = useApp();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      req: "",
      discountPercentage: 0,
      netValue: 0,
      paymentStatus: "Pendente",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newOrder: GroupedOrder = {
      prescriberName: values.prescriberName,
      orderNumbers: [values.req], // Using REQ as order number
      orderDate: new Date(values.orderDate),
      status: 'Efetivado', // Defaulting manually added orders to Effective
      netValue: values.netValue,
      req: values.req,
      discountPercentage: values.discountPercentage,
      paymentStatus: values.paymentStatus,
    };

    addOrders([newOrder]);
    toast({
      title: "Pedido Adicionado",
      description: "O novo pedido foi registrado com sucesso.",
    });
    setIsNewOrderOpen(false);
    form.reset();
  };

  // Get available months
  const availableMonths = Array.from(new Set(orders.map(o => {
    const date = new Date(o.orderDate);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }))).sort();

  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Pedidos de Parceiros
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie pedidos importados e manuais.
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Pedido Manual</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do pedido abaixo.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="prescriberName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Parceiro</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {prescribers.map(p => (
                              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Compra</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="req"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>REQ</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="netValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Pagamento (Mês Atual)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Pago">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit">Adicionar Pedido</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {orders.length > 0 && (
            <Button variant="destructive" onClick={clearOrders}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        <CSVUpload />
        <MonthlyOrders filterMonth={selectedMonth} />
      </div>
    </div>
  );
}
