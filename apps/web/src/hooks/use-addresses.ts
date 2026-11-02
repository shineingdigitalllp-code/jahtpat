import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "@jhatpat/shared";
import { api, apiSend, ApiError } from "@/lib/api";

export const ADDRESSES_KEY = ["addresses"];

export function useAddresses(initialData?: Address[]) {
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => api<Address[]>("/addresses"),
    initialData,
    staleTime: 30_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
  });
}

export function useSetDefaultAddress({ onError, onSuccess }: { onError?: (error: Error) => void; onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiSend(`/addresses/${id}/default`, "POST"),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ADDRESSES_KEY });
      const previous = queryClient.getQueryData<Address[]>(ADDRESSES_KEY);
      queryClient.setQueryData<Address[]>(ADDRESSES_KEY, (list = []) =>
        list.map((item) => ({ ...item, isDefault: item.id === id })),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ADDRESSES_KEY, context.previous);
      onError?.(error);
    },
    onSuccess,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      void queryClient.invalidateQueries({ queryKey: ["checkout-quote"] });
    },
  });
}
