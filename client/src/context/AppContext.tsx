import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  // Temporary state that doesn't need to be persisted
  selectedPrescriberId: number | null;
  setSelectedPrescriberId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedPrescriberId, setSelectedPrescriberId] = useState<number | null>(null);

  return (
    <AppContext.Provider value={{ 
      selectedPrescriberId,
      setSelectedPrescriberId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
