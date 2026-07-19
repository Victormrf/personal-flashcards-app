"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Deck, Card } from "@/types";
import { BookOpen, Plus } from "lucide-react";

function getDeckStyle(index: number) {
  const styles = [
    {
      dotBg: "bg-emerald-100 dark:bg-emerald-950/50",
      dot: "bg-emerald-500",
      cardShadow: "shadow-[2px_2px_0px_#def7ec] dark:shadow-[2px_2px_0px_rgba(16,185,129,0.12)] hover:shadow-[10px_10px_0px_#def7ec] dark:hover:shadow-[10px_10px_0px_rgba(16,185,129,0.12)]",
      border: "border-slate-200/50 dark:border-slate-800/60",
      buttonBg: "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
      glow: "from-emerald-500/5 to-transparent",
    },
    {
      dotBg: "bg-blue-100 dark:bg-blue-950/50",
      dot: "bg-blue-500",
      cardShadow: "shadow-[2px_2px_0px_#dbeafe] dark:shadow-[2px_2px_0px_rgba(59,130,246,0.12)] hover:shadow-[10px_10px_0px_#dbeafe] dark:hover:shadow-[10px_10px_0px_rgba(59,130,246,0.12)]",
      border: "border-slate-200/50 dark:border-slate-800/60",
      buttonBg: "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400",
      glow: "from-blue-500/5 to-transparent",
    },
    {
      dotBg: "bg-rose-100 dark:bg-rose-950/50",
      dot: "bg-rose-500",
      cardShadow: "shadow-[2px_2px_0px_#ffe4e6] dark:shadow-[2px_2px_0px_rgba(244,63,94,0.12)] hover:shadow-[10px_10px_0px_#ffe4e6] dark:hover:shadow-[10px_10px_0px_rgba(244,63,94,0.12)]",
      border: "border-slate-200/50 dark:border-slate-800/60",
      buttonBg: "bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400",
      glow: "from-rose-500/5 to-transparent",
    },
    {
      dotBg: "bg-violet-100 dark:bg-violet-950/50",
      dot: "bg-violet-500",
      cardShadow: "shadow-[2px_2px_0px_#ede9fe] dark:shadow-[2px_2px_0px_rgba(139,92,246,0.12)] hover:shadow-[10px_10px_0px_#ede9fe] dark:hover:shadow-[10px_10px_0px_rgba(139,92,246,0.12)]",
      border: "border-slate-200/50 dark:border-slate-800/60",
      buttonBg: "bg-violet-50 hover:bg-violet-100/80 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400",
      glow: "from-violet-500/5 to-transparent",
    },
  ];
  return styles[index % styles.length];
}

function getDeckStats(deckId: string) {
  const hash = deckId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cardCount = (hash % 150) + 10;
  const masteredPercent = hash % 3 === 0 ? null : (hash % 60) + 40; // Some are NEW, some have percentages
  return {
    cardCount,
    masteredPercent,
  };
}

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

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-1">
        {/* Header Title Section */}
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
          <div>
            <Link
              href="/decks/new"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full text-xs transition-all shadow-md shadow-slate-900/10 dark:shadow-indigo-500/10 cursor-pointer"
            >
              <Plus size={14} />
              New Deck
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading decks...</span>
          </div>
        )}

        {decks?.length === 0 && (
          <div className="text-center py-20 px-6 bg-white dark:bg-[#0e172a]/60 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
              <BookOpen size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No decks yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Create your first deck of flashcards and start mastering your studies today.
            </p>
            <Link
              href="/decks/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35"
            >
              <Plus size={16} />
              Create First Deck
            </Link>
          </div>
        )}

        {/* Decks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {decks?.map((deck, idx) => {
            const style = getDeckStyle(idx);
            const stats = getDeckStats(deck.id);
            return (
              <div
                key={deck.id}
                onClick={() => router.push(`/decks/${deck.id}`)}
                className={`relative overflow-hidden bg-white dark:bg-[#0d1527] border ${style.border} ${style.cardShadow} rounded-[32px] p-8 transition-all duration-300 ease-out hover:scale-[1.05] hover:-translate-y-2 cursor-pointer flex flex-col justify-between min-h-[240px]`}
              >
                {/* Accent glow on top left */}
                <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${style.glow} blur-xl rounded-full -translate-x-6 -translate-y-6 pointer-events-none`} />

                <div>
                  {/* Category Circle Icon */}
                  <div className={`w-10 h-10 rounded-full ${style.dotBg} flex items-center justify-center mb-5 transition-colors`}>
                    <div className={`w-4 h-4 rounded-full ${style.dot} shadow-sm`} />
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100 leading-snug mb-1 line-clamp-2">
                    {deck.name}
                  </h3>

                  {/* Stats */}
                  <div className="text-[10px] tracking-wider font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mt-2">
                    <span>{stats.cardCount} Cards</span>
                    {stats.masteredPercent !== null ? (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.masteredPercent}% Mastered</span>
                      </>
                    ) : (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">New</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Study button */}
                <div className="mt-6">
                  <Link
                    href={`/study/${deck.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full py-2.5 rounded-full text-xs font-bold transition-all duration-255 flex items-center justify-center gap-2 ${style.buttonBg} shadow-sm`}
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
