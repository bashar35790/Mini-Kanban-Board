"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AddColumnFormProps = {
  onSubmit: (title: string) => void;
};

export function AddColumnForm({ onSubmit }: AddColumnFormProps) {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="flex h-12 w-72 shrink-0 items-center justify-center gap-1 rounded-card border border-dashed border-border bg-surface/50 text-sm text-muted transition-colors hover:border-primary/50 hover:text-primary"
      >
        + Add column
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim());
    setTitle("");
    setActive(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-72 shrink-0 flex-col gap-2 rounded-card border border-border bg-surface p-3"
    >
      <Input
        name="columnTitle"
        placeholder="Column title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="h-9"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          Add column
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setActive(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
