"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { categoryColor } from "@/lib/categoryColor";
import { Deck, Card } from "@/types";
import { BookOpen, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: () => api.get("/decks").then((r) => r.data),
  });

  const { data: dueCards } = useQuery<Card[]>({
    queryKey: ["due-cards"],
    queryFn: () => api.get("/study").then((r) => r.data),
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const filteredDecks = activeCategory
    ? decks?.filter((d) => d.category === activeCategory)
    : decks;

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-1">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Your Decks
              </h1>
              {dueCards && dueCards.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                  {dueCards.length} due
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Master your knowledge, one card at a time.
            </p>
          </div>
          <Link
            href="/decks/new"
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full text-xs transition-all shadow-md shadow-slate-900/10 dark:shadow-indigo-500/10 cursor-pointer"
          >
            <Plus size={14} />
            New Deck
          </Link>
        </div>

        {/* Category filter bar */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeCategory === null
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const colors = categoryColor(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  style={isActive ? {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                  } : undefined}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                    isActive
                      ? "border shadow-sm"
                      : "border-transparent bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading decks...</span>
          </div>
        )}

        {/* Empty state */}
        {filteredDecks?.length === 0 && !isLoading && (
          <div className="text-center py-20 px-6 bg-white dark:bg-[#0e172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
              <BookOpen size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {activeCategory ? `No decks in "${activeCategory}"` : "No decks yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              {activeCategory
                ? "Try a different category or clear the filter."
                : "Create your first deck of flashcards and start mastering your studies today."}
            </p>
            {!activeCategory && (
              <Link
                href="/decks/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-500/25"
              >
                <Plus size={16} />
                Create First Deck
              </Link>
            )}
          </div>
        )}

        {/* Deck grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredDecks?.map((deck) => {
            const colors = categoryColor(deck.category);
            return (
              <div
                key={deck.id}
                onClick={() => router.push(`/decks/${deck.id}`)}
                className={`relative overflow-hidden bg-white dark:bg-[#0d1527] border border-slate-200/50 dark:border-slate-800/60 rounded-[32px] p-8 transition-all duration-300 ease-out hover:scale-[1.05] hover:-translate-y-2 cursor-pointer flex flex-col justify-between min-h-[240px]`}
                style={{
                  boxShadow: `2px 2px 0px ${colors.bg}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `10px 10px 0px ${colors.bg}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `2px 2px 0px ${colors.bg}`;
                }}
              >
                {/* Accent glow */}
                <div
                  className="absolute top-0 left-0 w-24 h-24 blur-xl rounded-full -translate-x-6 -translate-y-6 pointer-events-none"
                  style={{ backgroundColor: colors.bg, opacity: 0.6 }}
                />

                <div>
                  {/* Category dot — hash-colored, replaces index-based dot */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: colors.dot }}
                    />
                  </div>

                  {/* Deck name */}
                  <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100 leading-snug mb-1 line-clamp-2">
                    {deck.name}
                  </h3>

                  {/* Category badge — only shown if category is set */}
                  {deck.category && (
                    <span
                      className="inline-block mt-2 text-[10px] tracking-wider font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {deck.category}
                    </span>
                  )}
                </div>

                {/* Study button */}
                <div className="mt-6">
                  <Link
                    href={`/study/${deck.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                    }}
                  >
                    Study Deck
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}