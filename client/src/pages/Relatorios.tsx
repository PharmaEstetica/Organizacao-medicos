import { useState } from "react";
import { ReportsList } from "@/components/ReportsList";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ShoppingBag, PlusCircle, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVUpload } from "@/components/CSVUpload";
import { MonthlyOrders } from "@/components/MonthlyOrders";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GroupedOrder } from "@/types";

const orderFormSchema = z.object({
  prescriberName: z.string().min(1, "Selecione um parceiro"),
  orderDate: z.string().min(1, "Data é obrigatória"),
  req: z.string().min(1, "REQ é obrigatório"),
  discountPercentage: z.coerce.number().min(0).max(100),
  netValue: z.coerce.number().min(0),
  paymentStatus: z.enum(["Pago", "Pendente"]),
});

export default function Relatorios() {
  const { prescribers, orders, generateReport, reports, addOrders, clearOrders } = useApp();
  const { toast } = useToast();
  
  // Reports State
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Orders State
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [ordersFilterMonth, setOrdersFilterMonth] = useState<string>("all");

  // Get available months from orders
  const availableMonths = Array.from(new Set(orders.map(o => {
    const date = new Date(o.orderDate);
    return `${date.getMonth() + 1}/${date.getFullYear()}`; // "12/2023"
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
    const newOrder: GroupedOrder = {
      prescriberName: values.prescriberName,
      orderNumbers: [values.req], 
      orderDate: new Date(values.orderDate),
      status: 'Efetivado',
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
    orderForm.reset();
  };

  const handleGenerateAll = async () => {
    if (!selectedMonth) {
      toast({
        title: "Erro",
        description: "Selecione um mês de referência.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Filter orders for the selected month
      const [month, year] = selectedMonth.split('/').map(Number);
      
      for (const prescriber of prescribers) {
        const prescriberOrders = orders.filter(o => {
          const d = new Date(o.orderDate);
          return d.getMonth() + 1 === month && 
                 d.getFullYear() === year && 
                 o.prescriberName.toLowerCase() === prescriber.name.toLowerCase();
        });

        if (prescriberOrders.length === 0) continue;

        const effectiveOrders = prescriberOrders.filter(o => o.status === 'Efetivado');
        const nonEffectiveOrders = prescriberOrders.filter(o => o.status === 'Não efetivado');
        
        const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + o.netValue, 0);
        const commissionValue = totalEffectiveValue * (prescriber.commission_percentage / 100);
        const expenses = 0; // Mock expenses for now
        const finalBalance = commissionValue - expenses;
        const conversionRate = (effectiveOrders.length / prescriberOrders.length) * 100;

        // Generate PDF
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(230, 200, 235); // #E6C8EB
        doc.rect(15, 15, 180, 15, 'F');
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(prescriber.name, 20, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Conversão: ${conversionRate.toFixed(1)}%`, 150, 25);

        let y = 40;

        // Table Effective
        autoTable(doc, {
          startY: y,
          head: [['Data', 'Status', 'Valor Líquido', 'Paciente', `${prescriber.commission_percentage}% Comissão`]],
          body: effectiveOrders.map(o => [
            new Date(o.orderDate).toLocaleDateString('pt-BR'),
            o.status,
            `R$ ${o.netValue.toFixed(2)}`,
            o.patient || '',
            '' 
          ]),
          theme: 'grid',
          headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50] },
          styles: { fontSize: 8 },
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 10;

        // Totals
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", 20, y);
        doc.text(`R$ ${totalEffectiveValue.toFixed(2)}`, 120, y);
        doc.text(`R$ ${commissionValue.toFixed(2)}`, 160, y);

        y += 10;
        doc.setTextColor(200, 0, 0);
        doc.text("COMPRAS", 20, y);
        doc.text(`-R$ ${expenses.toFixed(2)}`, 160, y);

        y += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text("SALDO", 20, y);
        doc.text(`R$ ${finalBalance.toFixed(2)}`, 160, y);

        // Non Effective
        if (nonEffectiveOrders.length > 0) {
          y += 20;
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          doc.text("Pedidos Não Efetivados", 20, y);
          
          autoTable(doc, {
            startY: y + 5,
            head: [['Data', 'Status', 'Valor Líquido', 'Paciente']],
            body: nonEffectiveOrders.map(o => [
              new Date(o.orderDate).toLocaleDateString('pt-BR'),
              o.status,
              `R$ ${o.netValue.toFixed(2)}`,
              o.patient || ''
            ]),
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50] },
            styles: { fontSize: 8 },
          });
        }

        generateReport(prescriber.id, selectedMonth, {
          total_orders: prescriberOrders.length,
          effective_orders: effectiveOrders.length,
          conversion_rate: conversionRate,
          total_effective_value: totalEffectiveValue,
          commission_value: commissionValue,
          expenses: expenses,
          final_balance: finalBalance,
          pdf_path: "mock_path.pdf" 
        });
      }

      toast({
        title: "Sucesso",
        description: "Relatórios gerados com sucesso!",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatórios.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (reportId: number) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const prescriber = prescribers.find(p => p.id === report.prescriber_id);
    if (!prescriber) return;

    toast({
        title: "Download Iniciado",
        description: `Baixando relatório de ${prescriber.name}... (Simulação)`,
    });
    
    const doc = new jsPDF();
    doc.text(`Relatório: ${prescriber.name}`, 20, 20);
    doc.text(`Mês: ${report.reference_month}`, 20, 30);
    doc.text(`Saldo: R$ ${report.final_balance.toFixed(2)}`, 20, 40);
    doc.save(`Relatorio_${prescriber.name}_${report.reference_month.replace('/', '-')}.pdf`);
  };

  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie pedidos de parceiros e emita relatórios financeiros.
        </p>
      </div>

      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="pedidos">Pedidos de Parceiros</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios Financeiros</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <MonthlyOrders filterMonth={ordersFilterMonth} />
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatórios</CardTitle>
              <CardDescription>
                Selecione o mês para calcular comissões e gerar PDFs para todos os prescritores.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="w-[200px]">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.length === 0 ? (
                      <SelectItem value="empty" disabled>Sem dados</SelectItem>
                    ) : (
                      availableMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateAll} disabled={isGenerating || !selectedMonth}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Gerar Relatórios
              </Button>
            </CardContent>
          </Card>

          <ReportsList onDownload={handleDownload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
