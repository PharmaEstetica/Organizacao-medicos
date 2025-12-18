import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, Activity, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Buscar", icon: Search },
    { href: "/cadastros", label: "Cadastros", icon: Users },
    { href: "/pedidos", label: "Pedidos", icon: LayoutDashboard },
    { href: "/relatorios", label: "Relatórios & Pedidos", icon: FileText },
  ];

  return (
    <header className="sticky top-4 z-50 mx-auto w-[95%] max-w-7xl rounded-2xl glass border border-white/40 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex h-16 items-center px-6 justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-serif text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Prescriber
          </span>
        </Link>
        
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "text-primary bg-primary/10 font-semibold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "stroke-[2.5px]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
