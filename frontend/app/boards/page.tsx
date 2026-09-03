"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBoards } from "@/hooks/useBoards";
import { BoardList } from "@/components/boards/BoardList";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";

export default function BoardsPage() {
  const router = useRouter();
  const { user, isPending: authPending, signOut } = useAuth();
  const { data: boards, isPending, isError, error } = useBoards();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  if (authPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover font-bold text-white">
            K
          </span>
          <h1 className="text-lg font-semibold text-text">Boards</h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Avatar name={user.name ?? user.email} size="sm" />
              <span className="hidden text-sm text-muted sm:inline">
                {user.name ?? user.email}
              </span>
            </div>
          ) : null}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Your boards</h2>
          <Button onClick={() => setCreateOpen(true)}>+ New board</Button>
        </div>

        {isPending ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-danger">
              {(error as Error)?.message ?? "Failed to load boards"}
            </p>
            <Button variant="secondary" onClick={() => router.refresh()}>
              Retry
            </Button>
          </div>
        ) : boards ? (
          <BoardList boards={boards} userName={user?.name ?? user?.email ?? ""} />
        ) : null}
      </main>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
