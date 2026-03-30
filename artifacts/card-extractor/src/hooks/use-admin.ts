import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminCards as useGeneratedGetAdminCards,
  useDeleteAdminCard as useGeneratedDeleteAdminCard,
  getGetAdminCardsQueryKey,
  useGetAdminUsers as useGeneratedGetAdminUsers,
  getGetAdminUsersQueryKey,
} from "@workspace/api-client-react";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
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
      queryKey: getGetAdminCardsQueryKey(params),
      retry: false,
    },
  });
}

export function useAdminUsers() {
  return useGeneratedGetAdminUsers({
    request: getAuthHeaders(),
    query: {
      queryKey: getGetAdminUsersQueryKey(),
      retry: false,
    },
  });
}

export function useDeleteAdminCard() {
  const queryClient = useQueryClient();

  return useGeneratedDeleteAdminCard({
    request: getAuthHeaders(),
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [getGetAdminCardsQueryKey()[0]],
        });
      },
    },
  });
}
