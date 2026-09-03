"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

export type Board = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: BoardRole;
};

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const data = await apiFetch<{ boards: Board[] }>("/boards");
      return data.boards;
    },
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      const data = await apiFetch<{ board: Board }>("/boards", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
