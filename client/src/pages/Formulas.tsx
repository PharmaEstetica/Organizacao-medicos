import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Plus, Search, User, FileText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { FormulaForm } from "@/components/FormulaForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Formulas() {
  const { formulas, prescribers, deleteFormula } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getPrescriberName = (id: number | null) => {
    if (!id) return "Nenhum";
    return prescribers.find(p => p.id === id)?.name || "Desconhecido";
  };

  const filteredFormulas = formulas.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.pharmaceuticalForm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Fórmulas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seu banco de fórmulas farmacêuticas.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Fórmula
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card border border-border px-3 rounded-md shadow-sm w-full md:w-96">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar fórmulas..." 
          className="border-0 focus-visible:ring-0 px-2 shadow-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFormulas.map((formula) => (
          <Card key={formula.id} className="group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-start gap-2">
                <span className="text-lg font-bold leading-tight">{formula.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir fórmula?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteFormula(formula.id)} className="bg-destructive hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
              <div className="bg-muted/30 p-3 rounded text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                {formula.content}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredFormulas.length === 0 && (
          <div className="col-span-full text-center py-20 bg-muted/10 rounded-lg border border-dashed border-border">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FlaskConical className="h-10 w-10 opacity-20" />
              <p>Nenhuma fórmula encontrada.</p>
            </div>
          </div>
        )}
      </div>

      <FormulaForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
