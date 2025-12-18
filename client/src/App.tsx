import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";

// Pages
import Cadastros from "@/pages/Cadastros";
import PedidosDoMes from "@/pages/PedidosDoMes";
import Relatorios from "@/pages/Relatorios";
import Buscar from "@/pages/Buscar";

function Router() {
  return (
    <div className="w-full bg-muted/20 min-h-screen">
      <div className="max-w-screen-2xl mx-auto p-6 lg:p-10 animate-in fade-in duration-500">
        <Switch>
          <Route path="/" component={Buscar} />
          <Route path="/cadastros" component={Cadastros} />
          <Route path="/pedidos" component={PedidosDoMes} />
          <Route path="/relatorios" component={Relatorios} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
