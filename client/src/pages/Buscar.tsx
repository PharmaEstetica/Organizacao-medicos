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
    <div className="container py-10 max-w-screen-2xl space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
          Buscar Prescritor
        </h1>
        <p className="text-muted-foreground text-lg">
          Encontre rapidamente informações sobre médicos e parceiros cadastrados.
        </p>
        
        <div className="relative mt-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome ou especialidade..." 
            className="pl-12 h-12 text-lg rounded-full shadow-sm border-primary/20 bg-background/50 backdrop-blur-sm focus:bg-background transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {filteredPrescribers.map((prescriber) => (
          <Card key={prescriber.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/10 to-violet-100/50 p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                    {prescriber.photo_url ? (
                      <img src={prescriber.photo_url} alt={prescriber.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                        {prescriber.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center">{prescriber.name}</h3>
                <p className="text-primary font-medium">{prescriber.specialty}</p>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4 divide-x divide-border/50">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <FlaskConical className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Fórmulas</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{prescriber.formulas_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Criadas</p>
                </div>
                
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Embalagens</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{prescriber.packagings_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPrescribers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum prescritor encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
