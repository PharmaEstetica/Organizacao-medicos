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
import PedidosDoMes from "@/pages/PedidosDoMes"; // Will be created next
import Relatorios from "@/pages/Relatorios"; // Will be created next

function Router() {
  return (
    <Switch>
      <Route path="/" component={Cadastros} />
      <Route path="/pedidos" component={PedidosDoMes} />
      <Route path="/relatorios" component={Relatorios} />
      <Route component={NotFound} />
    </Switch>
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
