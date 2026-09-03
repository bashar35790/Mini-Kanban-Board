import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — TASK Kanban",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 font-bold text-white shadow-md shadow-pink-200">
            T
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue to your workspace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
