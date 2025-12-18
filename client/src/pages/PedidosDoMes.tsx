import { CSVUpload } from "@/components/CSVUpload";
import { MonthlyOrders } from "@/components/MonthlyOrders";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function PedidosDoMes() {
  const { clearOrders, orders } = useApp();

  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos do Mês</h1>
          <p className="text-muted-foreground mt-2">
            Importe o CSV de pedidos e visualize os dados consolidados.
          </p>
        </div>
        {orders.length > 0 && (
          <Button variant="destructive" onClick={clearOrders}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Pedidos
          </Button>
        )}
      </div>

      <div className="grid gap-8">
        <CSVUpload />
        <MonthlyOrders />
      </div>
    </div>
  );
}
