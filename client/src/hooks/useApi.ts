import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Prescriber, type Packaging, type Formula, type CsvOrder, type ManualOrder, type Report } from "@/lib/api";

export function usePrescribers() {
  return useQuery({
    queryKey: ["prescribers"],
    queryFn: api.prescribers.getAll,
  });
}

export function useCreatePrescriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.prescribers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescribers"] });
    },
  });
}

export function useUpdatePrescriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Prescriber> }) =>
      api.prescribers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescribers"] });
    },
  });
}

export function useDeletePrescriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.prescribers.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescribers"] });
    },
  });
}

export function usePackagings() {
  return useQuery({
    queryKey: ["packagings"],
    queryFn: api.packagings.getAll,
  });
}

export function useCreatePackaging() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.packagings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
  });
}

export function useDeletePackaging() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.packagings.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
  });
}

export function useUpdatePackaging() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Packaging> }) =>
      api.packagings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
  });
}

export function useFormulas() {
  return useQuery({
    queryKey: ["formulas"],
    queryFn: api.formulas.getAll,
  });
}

export function useCreateFormula() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.formulas.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });
}

export function useUpdateFormula() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Formula> }) =>
      api.formulas.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });
}

export function useDeleteFormula() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.formulas.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
      queryClient.invalidateQueries({ queryKey: ["formulas-with-prescribers"] });
    },
  });
}

export function useFormulasWithPrescribers() {
  return useQuery({
    queryKey: ["formulas-with-prescribers"],
    queryFn: api.formulas.getAllWithPrescribers,
  });
}

export function useSetFormulaPrescribers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prescriberIds }: { id: number; prescriberIds: number[] }) =>
      api.formulas.setPrescribers(id, prescriberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
      queryClient.invalidateQueries({ queryKey: ["formulas-with-prescribers"] });
    },
  });
}

export function useCsvOrders() {
  return useQuery({
    queryKey: ["csv-orders"],
    queryFn: api.csvOrders.getAll,
  });
}

export function useCreateCsvOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.csvOrders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csv-orders"] });
    },
  });
}

export function useDeleteAllCsvOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.csvOrders.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csv-orders"] });
    },
  });
}

export function useDeleteCsvOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.csvOrders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csv-orders"] });
    },
  });
}

export function useManualOrders() {
  return useQuery({
    queryKey: ["manual-orders"],
    queryFn: api.manualOrders.getAll,
  });
}

export function useCreateManualOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.manualOrders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
    },
  });
}

export function useUpdateManualOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ManualOrder> }) =>
      api.manualOrders.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
    },
  });
}

export function useDeleteManualOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.manualOrders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
    },
  });
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: api.reports.getAll,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.reports.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.reports.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function usePharmaceuticalForms() {
  return useQuery({
    queryKey: ["pharmaceutical-forms"],
    queryFn: api.pharmaceuticalForms.getAll,
  });
}

export function useCreatePharmaceuticalForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.pharmaceuticalForms.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmaceutical-forms"] });
    },
  });
}
