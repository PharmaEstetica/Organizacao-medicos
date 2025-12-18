import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Prescriber, type Packaging, type Formula, type Order, type Report } from "@/lib/api";

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
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: api.orders.getAll,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.orders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.orders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
