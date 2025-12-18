import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Buscar", icon: Search },
    { href: "/cadastros", label: "Cadastros", icon: Users },
    { href: "/pedidos", label: "Pedidos", icon: LayoutDashboard },
    { href: "/relatorios", label: "Relatórios", icon: FileText },
  ];

  return (
    <div className="w-full bg-background border-b border-border/60 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto">
        <header className="flex h-16 items-center px-6 justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer select-none">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-primary">
              Prescriber<span className="opacity-50">Manager</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                    isActive 
                      ? "text-primary bg-secondary/80" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "stroke-[2.5px]")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
      </div>
    </div>
  );
}
