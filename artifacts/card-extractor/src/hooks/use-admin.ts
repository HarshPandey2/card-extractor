import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminCards as useGeneratedGetAdminCards,
  useDeleteAdminCard as useGeneratedDeleteAdminCard,
  getGetAdminCardsQueryKey,
  useGetAdminUsers as useGeneratedGetAdminUsers,
  getGetAdminUsersQueryKey,
  exportAdminCards,
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

export async function exportAdminCardsToExcel(params?: { startDate?: string; endDate?: string; search?: string }) {
  try {
    const blob = await exportAdminCards(params, getAuthHeaders());
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cards-export-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export cards:", error);
    throw error;
  }
}
