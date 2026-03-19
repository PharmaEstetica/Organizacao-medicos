import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingBag } from "lucide-react";
import { useManualOrders, usePrescribers, useCreateManualOrder } from "@/hooks/useApi";
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
import { ManualOrdersTable } from "@/components/ManualOrdersTable";

const orderFormSchema = z.object({
  prescriberId: z.coerce.number().min(1, "Selecione um parceiro"),
  orderDate: z.string().min(1, "Data é obrigatória"),
  orderNumbers: z.string().min(1, "REQ/Pedidos é obrigatório"),
  status: z.enum(["Aprovado", "Recusado", "No carrinho"]),
  netValue: z.coerce.number().min(0),
  paymentStatus: z.enum(["paid", "pending"]),
});

export function OrdersManager() {
  const { data: orders = [] } = useManualOrders();
  const { data: prescribers = [] } = usePrescribers();
  const createOrder = useCreateManualOrder();
  const { toast } = useToast();
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [ordersFilterMonth, setOrdersFilterMonth] = useState<string>("all");

  const availableMonths = Array.from(new Set(orders.map(o => {
    const dateOnly = (o.orderDate || "").split("T")[0];
    const [year, month] = dateOnly.split("-").map(Number);
    return `${month || 1}/${year}`;
  }))).sort();

  const orderForm = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNumbers: "",
      status: "Aprovado",
      netValue: 0,
      paymentStatus: "pending",
    },
  });

  const onOrderSubmit = (values: z.infer<typeof orderFormSchema>) => {
    createOrder.mutate({
      prescriberId: values.prescriberId,
      orderNumbers: values.orderNumbers,
      orderDate: values.orderDate,
      status: values.status,
      netValue: values.netValue.toString(),
      req: values.orderNumbers,
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
            Pedidos Manuais
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os pedidos criados manualmente
          </p>
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
              <Button data-testid="button-new-order">
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
                    name="prescriberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parceiro</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-prescriber">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {prescribers.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
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
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-order-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="orderNumbers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>REQ / Pedidos</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} data-testid="input-order-numbers" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Aprovado">Aprovado</SelectItem>
                              <SelectItem value="Recusado">Recusado</SelectItem>
                              <SelectItem value="No carrinho">No carrinho</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="netValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Líquido</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} data-testid="input-net-value" />
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
                        <FormLabel>Status Pagamento</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="pending" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Pendente
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="paid" />
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
                    <Button type="submit" data-testid="button-submit-order">Adicionar Pedido</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <ManualOrdersTable filterMonth={ordersFilterMonth} />
    </div>
  );
}
