"use client";

import { useState } from "react";
import { useMembers } from "@/hooks/useMembers";
import type { Member } from "@/hooks/useBoard";
import type { BoardRole } from "@/hooks/useBoards";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";

const roles: BoardRole[] = ["VIEWER", "EDITOR", "OWNER"];

const roleLabels: Record<BoardRole, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

type ShareBoardModalProps = {
  open: boolean;
  onClose: () => void;
  boardId: string;
  currentUserId: string;
};

export function ShareBoardModal({
  open,
  onClose,
  boardId,
  currentUserId,
}: ShareBoardModalProps) {
  const { query, invite, changeRole, removeMember } = useMembers(boardId);

  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<BoardRole>("VIEWER");

  const members = query.data ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await invite.mutateAsync({ email: email.trim(), role: selectedRole });
    setEmail("");
    setSelectedRole("VIEWER");
  };

  return (
    <Modal open={open} onClose={onClose} title="Share board">
      <form onSubmit={handleInvite} className="mb-6 flex flex-col gap-3">
        <Input
          name="email"
          type="email"
          label="Invite by email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={invite.isPending}
        />

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Role</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    selectedRole === role
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-muted hover:text-text"
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" loading={invite.isPending} className="flex-1">
            Invite
          </Button>
        </div>

        {invite.isError ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {(invite.error as Error)?.message ?? "Failed to invite"}
          </p>
        ) : null}
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-text">Members</h3>
        {query.isPending ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.userId === currentUserId}
                onChangeRole={(role) =>
                  changeRole.mutate({ userId: member.userId, role })
                }
                onRemove={() => removeMember.mutate(member.userId)}
                removing={removeMember.isPending}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

type MemberRowProps = {
  member: Member;
  isSelf: boolean;
  onChangeRole: (role: BoardRole) => void;
  onRemove: () => void;
  removing: boolean;
};

function MemberRow({
  member,
  isSelf,
  onChangeRole,
  onRemove,
  removing,
}: MemberRowProps) {
  const name = member.user?.name ?? "Unknown";
  const email = member.user?.email ?? "";

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">
            {name}
            {isSelf ? <span className="ml-1 text-xs text-muted">(you)</span> : null}
          </p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={member.role}
          onChange={(e) => onChangeRole(e.target.value as BoardRole)}
          disabled={removing || isSelf}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text focus:border-primary focus:outline-none disabled:opacity-60"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
        {!isSelf && member.role !== "OWNER" ? (
          <button
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove ${name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-60"
          >
            ✕
          </button>
        ) : null}
      </div>
    </li>
  );
}
