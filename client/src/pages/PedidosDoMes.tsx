import { OrdersManager } from "@/components/OrdersManager";
import { ShoppingBag } from "lucide-react";

export default function PedidosDoMes() {
  return (
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Pedidos de Parceiros
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os pedidos feitos manualmente ou via importação.
        </p>
      </div>

      <OrdersManager hideImport={true} />
    </div>
  );
}
