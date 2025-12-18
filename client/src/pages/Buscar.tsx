import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrescribers, useFormulas } from "@/hooks/useApi";
import type { Prescriber, Formula } from "@/lib/api";
import { Search, FlaskConical, Package, User, FileText, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Buscar() {
  const { data: prescribers = [] } = usePrescribers();
  const { data: formulas = [] } = useFormulas();
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for modals
  const [selectedPrescriber, setSelectedPrescriber] = useState<Prescriber | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  const filteredPrescribers = prescribers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFormulas = formulas.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.pharmaceuticalForm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPrescriberName = (id: number | null) => {
    if (!id) return "Sem vínculo";
    return prescribers.find(p => p.id === id)?.name || "Desconhecido";
  };

  const getPrescriberFormulas = (prescriberId: number) => {
    return formulas.filter(f => f.prescriberId === prescriberId);
  };

  // Helper to "diagram" the formula content
  const FormulaDiagram = ({ formula }: { formula: Formula }) => {
    const components = formula.content.split('+').map((c: string) => c.trim());
    
    return (
      <div className="space-y-6 py-4">
        <div className="flex flex-col items-center">
          {/* Base Form Node */}
          <div className="w-full max-w-xs bg-primary/10 border border-primary/20 p-4 rounded-lg text-center mb-8 relative">
            <Badge variant="outline" className="mb-2 bg-background">{formula.pharmaceuticalForm}</Badge>
            <h4 className="font-bold text-lg text-primary">{formula.name}</h4>
            
            {/* Connection Line */}
            <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-border -translate-x-1/2"></div>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {components.map((comp: string, idx: number) => (
              <div key={idx} className="relative group">
                 {/* Connecting lines for visual tree effect (simplified) */}
                <div className="hidden md:block absolute left-1/2 -top-4 w-0.5 h-4 bg-border -translate-x-1/2"></div>
                
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">{comp}</span>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 bg-muted/20 p-4 rounded-lg border border-border/50">
            <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Resumo da Composição</h5>
            <p className="font-mono text-sm">{formula.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-2xl mx-auto py-12">
        <h1 className="text-5xl font-bold tracking-tight text-primary">
          Buscar
        </h1>
        <p className="text-muted-foreground text-xl font-light">
          Pesquise por prescritores ou fórmulas farmacêuticas.
        </p>
        
        <div className="mt-8 group border-b-2 border-border focus-within:border-primary transition-colors flex items-center gap-3 bg-transparent">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors flex-shrink-0" />
          <Input 
            placeholder="Digite o nome do médico, especialidade ou fórmula..." 
            className="h-14 text-lg rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 transition-all placeholder:text-muted-foreground/50 flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-10">
        
        {/* Prescribers Section */}
        {filteredPrescribers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/80">
              <User className="h-5 w-5" />
              Prescritores Encontrados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrescribers.map((prescriber) => (
                <Card 
                  key={prescriber.id} 
                  className="group hover:border-primary/50 transition-colors duration-300 rounded-sm border-border/60 bg-card cursor-pointer"
                  onClick={() => setSelectedPrescriber(prescriber)}
                >
                  <CardContent className="p-0">
                    <div className="p-6 flex items-start gap-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-sm bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-bold overflow-hidden">
                          {prescriber.photoUrl ? (
                            <img src={prescriber.photoUrl} alt={prescriber.name} className="h-full w-full object-cover" />
                          ) : (
                            prescriber.name.charAt(0)
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold leading-none group-hover:text-primary transition-colors">{prescriber.name}</h3>
                        <p className="text-sm text-muted-foreground">{prescriber.specialty}</p>
                        <div className="pt-2 flex gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-secondary rounded-sm text-secondary-foreground">
                            {prescriber.bondType}
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
                        <p className="text-xl font-bold">{prescriber.formulas_count || getPrescriberFormulas(prescriber.id).length}</p>
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
            </div>
          </div>
        )}

        {/* Formulas Section */}
        {filteredFormulas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/80">
              <FlaskConical className="h-5 w-5" />
              Fórmulas Encontradas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormulas.map((formula) => (
                <Card 
                  key={formula.id} 
                  className="group hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedFormula(formula)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start gap-2">
                      <span className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{formula.name}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">
                        {formula.pharmaceuticalForm}
                      </span>
                      {formula.prescriberId && (
                        <span className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          {getPrescriberName(formula.prescriberId)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-3 rounded text-sm font-mono text-muted-foreground line-clamp-2">
                      {formula.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredPrescribers.length === 0 && filteredFormulas.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-sm border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}".</p>
          </div>
        )}
      </div>

      {/* Prescriber Details Dialog */}
      <Dialog open={!!selectedPrescriber} onOpenChange={(open) => !open && setSelectedPrescriber(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary text-base">
                  {selectedPrescriber?.name.charAt(0)}
                </div>
                {selectedPrescriber?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedPrescriber?.specialty} • {selectedPrescriber?.bondType === 'N' ? 'Neutro' : 'Parceiro'}
            </DialogDescription>
          </DialogHeader>
          
          <Separator />
          
          <div className="flex-1 overflow-auto py-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Fórmulas Vinculadas
            </h3>
            
            {selectedPrescriber && getPrescriberFormulas(selectedPrescriber.id).length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {getPrescriberFormulas(selectedPrescriber.id).map(formula => (
                        <div 
                            key={formula.id} 
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-colors"
                            onClick={() => {
                                setSelectedPrescriber(null); // Close prescriber modal
                                setTimeout(() => setSelectedFormula(formula), 100); // Open formula modal slightly later for smooth transition
                            }}
                        >
                            <div>
                                <h4 className="font-bold text-sm">{formula.name}</h4>
                                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm mt-1 inline-block">
                                    {formula.pharmaceuticalForm}
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    Nenhuma fórmula vinculada a este prescritor.
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formula Diagram Dialog */}
      <Dialog open={!!selectedFormula} onOpenChange={(open) => !open && setSelectedFormula(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
                <FlaskConical className="h-6 w-6 text-primary" />
                Diagrama da Fórmula
            </DialogTitle>
            <DialogDescription>
                Visualização estruturada da composição farmacêutica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedFormula && <FormulaDiagram formula={selectedFormula} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
