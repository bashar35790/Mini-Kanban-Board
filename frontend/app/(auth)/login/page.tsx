import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Kanban",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-2xl backdrop-blur">
        <h1 className="mb-1 text-2xl font-bold text-text">Welcome back</h1>
        <p className="mb-6 text-sm text-muted">Sign in to access your boards</p>
        <LoginForm />
      </div>
    </div>
  );
}
