import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Me = { 
  id: string; 
  username: string; 
  phone?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string;
};
export type Address = { id: string; label?: string; name?: string; line1: string; line2?: string; city: string; region?: string; postalCode: string; country: string; phone?: string };

export function useMe() {
  return useQuery({ 
    queryKey: ["me"], 
    queryFn: async () => {
      return api.get<Me>("/api/auth/me");
    }
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Me>) => {
      // Cast payload to any if API expects a specific strict shape not fully covered by Partial<Me>
      // or better yet, fix api.put signature if needed. 
      // For now, payload is correct, removing unnecessary logging.
      return api.put<Me>("/api/auth/me", payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    }
  });
}

export function useAddresses() {
  const qc = useQueryClient();
  const list = useQuery({ 
    queryKey: ["addresses"], 
    queryFn: async () => {
      return api.get<Address[]>("/api/me/addresses");
    }
  });
  const create = useMutation({
    mutationFn: async (payload: Omit<Address, "id">) => {
      return api.post<Address>("/api/me/addresses", payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
  const update = useMutation({
    mutationFn: async (payload: { id: string } & Partial<Address>) => {
      return api.put<Address>(`/api/me/addresses/${payload.id}`, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/me/addresses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
  return { list, create, update, remove };
}
