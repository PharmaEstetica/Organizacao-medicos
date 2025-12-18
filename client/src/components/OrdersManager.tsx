import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, ShoppingBag } from "lucide-react";
import { useOrders, usePrescribers, useCreateOrder } from "@/hooks/useApi";
import type { Order } from "@/lib/api";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { CSVUpload } from "@/components/CSVUpload";
import { MonthlyOrders } from "@/components/MonthlyOrders";

const orderFormSchema = z.object({
  prescriberName: z.string().min(1, "Selecione um parceiro"),
  orderDate: z.string().min(1, "Data é obrigatória"),
  req: z.string().min(1, "REQ é obrigatório"),
  discountPercentage: z.coerce.number().min(0).max(100),
  netValue: z.coerce.number().min(0),
  paymentStatus: z.enum(["Pago", "Pendente"]),
});

interface OrdersManagerProps {
  hideImport?: boolean;
}

export function OrdersManager({ hideImport = false }: OrdersManagerProps) {
  const { data: orders = [] } = useOrders();
  const { data: prescribers = [] } = usePrescribers();
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [ordersFilterMonth, setOrdersFilterMonth] = useState<string>("all");

  const availableMonths = Array.from(new Set(orders.map(o => {
    const date = new Date(o.orderDate);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }))).sort();

  const orderForm = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      req: "",
      discountPercentage: 0,
      netValue: 0,
      paymentStatus: "Pendente",
    },
  });

  const onOrderSubmit = (values: z.infer<typeof orderFormSchema>) => {
    const prescriber = prescribers.find(p => p.name === values.prescriberName);
    
    createOrder.mutate({
      prescriberId: prescriber?.id || null,
      orderNumbers: values.req,
      orderDate: values.orderDate,
      status: 'Efetivado',
      netValue: values.netValue.toString(),
      req: values.req,
      discountPercentage: values.discountPercentage.toString(),
      paymentStatus: values.paymentStatus,
    }, {
      onSuccess: () => {
        toast({
          title: "Pedido Adicionado",
          description: "O novo pedido foi registrado com sucesso.",
        });
        setIsNewOrderOpen(false);
        orderForm.reset();
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Pedidos
          </h2>
        </div>
        <div className="flex gap-4">
          <Select value={ordersFilterMonth} onValueChange={setOrdersFilterMonth}>
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
              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={orderForm.control}
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
                      control={orderForm.control}
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
                      control={orderForm.control}
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
                      control={orderForm.control}
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
                      control={orderForm.control}
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
                    control={orderForm.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Status Pagamento (Mês Atual)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Pendente" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Pendente
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Pago" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Pago
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
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

        </div>
      </div>

      <div className="grid gap-8">
        {!hideImport && <CSVUpload />}
        <MonthlyOrders filterMonth={ordersFilterMonth} />
      </div>
    </div>
  );
}
