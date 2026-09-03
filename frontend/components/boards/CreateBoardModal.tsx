"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateBoard } from "@/hooks/useBoards";

type CreateBoardModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateBoardModal({ open, onClose }: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createBoard = useCreateBoard();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createBoard.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new board">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="title"
          label="Board title"
          placeholder="e.g. Product Launch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <Input
          name="description"
          label="Description (optional)"
          placeholder="What is this board for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {createBoard.isError ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {(createBoard.error as Error)?.message ?? "Failed to create board"}
          </p>
        ) : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createBoard.isPending}>
            Create board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
