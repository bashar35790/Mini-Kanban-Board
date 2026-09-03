"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const [activeTab, setActiveTab] = useState<"dashboard" | "my-boards" | "shared" | "favorites" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const filteredBoards = useMemo(() => {
    if (!boards) return [];
    let list = [...boards];

    // Filter by tab
    if (activeTab === "favorites") {
      list = list.filter((b) => b.isFavorite);
    } else if (activeTab === "my-boards") {
      list = list.filter((b) => b.role === "OWNER");
    } else if (activeTab === "shared") {
      list = list.filter((b) => b.role !== "OWNER");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [boards, activeTab, searchQuery]);

  if (authPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      {/* Left Navigation Sidebar matching Image 2 */}
      <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between p-5 select-none shrink-0">
        <div>
          {/* Logo brand */}
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-xl font-black tracking-tight text-blue-600">Flow</span>
            <span className="text-xl font-bold tracking-tight text-slate-900">Board</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("my-boards")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeTab === "my-boards"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              My Boards
            </button>

            <button
              onClick={() => setActiveTab("shared")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeTab === "shared"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Shared With Me
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeTab === "favorites"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Favorites
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* User profile footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar name={user?.name || user?.email || "User"} size="md" />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-bold text-slate-800">{user?.name || "Bashar"}</span>
              <span className="truncate text-[11px] text-slate-400">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">Boards</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-700 focus:bg-white focus:border-blue-400 focus:outline-none"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Action icons */}
            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <Avatar name={user?.name || user?.email || "User"} size="sm" />
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Good morning, {firstName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your projects and keep your team moving.
              </p>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm px-4 py-2 font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Create Board
            </Button>
          </div>

          {/* Boards List or State */}
          {isPending ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-8 w-8 text-blue-600" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-rose-500 font-medium">
                {(error as Error)?.message ?? "Failed to load boards"}
              </p>
              <Button variant="secondary" onClick={() => router.refresh()}>
                Retry
              </Button>
            </div>
          ) : (
            <BoardList boards={filteredBoards} />
          )}
        </main>
      </div>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
