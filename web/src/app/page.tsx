"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Deck, Card } from "@/types";
import { BookOpen, Plus, LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: () => api.get("/decks").then((r) => r.data),
  });

  const { data: dueCards } = useQuery<Card[]>({
    queryKey: ["due-cards"],
    queryFn: () => api.get("/study").then((r) => r.data),
  });

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Flashcards</h1>
        <div className="flex items-center gap-4">
          {dueCards && dueCards.length > 0 && (
            <span className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full">
              {dueCards.length} cards due
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Decks</h2>
          <Link
            href="/decks/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Deck
          </Link>
        </div>

        {isLoading && (
          <div className="text-gray-400">Loading decks...</div>
        )}

        {decks?.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No decks yet</p>
            <p className="text-sm mt-1">Create your first deck to start studying</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {decks?.map((deck) => (
            <div
              key={deck.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500 transition-colors cursor-pointer"
              onClick={() => router.push(`/decks/${deck.id}`)}
            >
              <h3 className="font-semibold text-lg mb-1">{deck.name}</h3>
              {deck.description && (
                <p className="text-gray-400 text-sm mb-4">{deck.description}</p>
              )}
              <Link
                href={`/study/${deck.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <BookOpen size={14} />
                Study
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
