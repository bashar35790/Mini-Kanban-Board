import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sign up — Kanban",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-2xl backdrop-blur">
        <h1 className="mb-1 text-2xl font-bold text-text">Create your account</h1>
        <p className="mb-6 text-sm text-muted">Start organizing with kanban boards</p>
        <RegisterForm />
      </div>
    </div>
  );
}
