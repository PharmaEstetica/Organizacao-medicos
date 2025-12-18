import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { Search, FlaskConical, Package } from "lucide-react";

export default function Buscar() {
  const { prescribers } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPrescribers = prescribers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-2xl mx-auto py-12">
        <h1 className="text-5xl font-bold tracking-tight text-primary">
          Buscar Prescritor
        </h1>
        <p className="text-muted-foreground text-xl font-light">
          Encontre rapidamente informações sobre médicos e parceiros cadastrados.
        </p>
        
        <div className="relative mt-8 group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Pesquisar por nome ou especialidade..." 
            className="pl-12 h-14 text-lg rounded-none border-b-2 border-x-0 border-t-0 border-border bg-transparent focus:border-primary focus:ring-0 px-0 transition-all placeholder:text-muted-foreground/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrescribers.map((prescriber) => (
          <Card key={prescriber.id} className="group hover:border-primary/50 transition-colors duration-300 rounded-sm border-border/60 bg-card">
            <CardContent className="p-0">
              <div className="p-6 flex items-start gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-sm bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-bold overflow-hidden">
                    {prescriber.photo_url ? (
                      <img src={prescriber.photo_url} alt={prescriber.name} className="h-full w-full object-cover" />
                    ) : (
                      prescriber.name.charAt(0)
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold leading-none">{prescriber.name}</h3>
                  <p className="text-sm text-muted-foreground">{prescriber.specialty}</p>
                  <div className="pt-2 flex gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-secondary rounded-sm text-secondary-foreground">
                      {prescriber.bond_type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-0 grid grid-cols-2 gap-4 border-t border-border/40 mt-2 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fórmulas</span>
                  </div>
                  <p className="text-xl font-bold">{prescriber.formulas_count || 0}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Embalagens</span>
                  </div>
                  <p className="text-xl font-bold">{prescriber.packagings_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPrescribers.length === 0 && (
          <div className="col-span-full text-center py-20 bg-muted/10 rounded-sm border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum prescritor encontrado com esse termo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
