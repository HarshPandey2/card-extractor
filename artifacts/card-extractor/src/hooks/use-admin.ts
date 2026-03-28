import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetAdminCards as useGeneratedGetAdminCards,
  useDeleteAdminCard as useGeneratedDeleteAdminCard,
  getGetAdminCardsQueryKey
} from "@workspace/api-client-react";

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
  };
}

export function useAdminCards(params: { search?: string; page?: number; limit?: number }) {
  return useGeneratedGetAdminCards(params, {
    request: getAuthHeaders(),
    query: {
      retry: false, // Don't retry on 401s
    }
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  
  return useGeneratedDeleteAdminCard({
    request: getAuthHeaders(),
    mutation: {
      onSuccess: () => {
        // Invalidate all admin cards queries
        queryClient.invalidateQueries({
          queryKey: [getGetAdminCardsQueryKey()[0]],
        });
      },
    },
  });
}

export function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login";
}
