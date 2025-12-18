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

function Router() {
  return (
    <div className="mx-auto max-w-7xl p-6 pt-8">
      <div className="glass-card min-h-[calc(100vh-140px)] rounded-3xl p-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
        <Switch>
          <Route path="/" component={Cadastros} />
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
          <div className="min-h-screen bg-background font-sans antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-background to-background dark:from-indigo-950/20">
            <Header />
            <main className="relative z-10">
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
