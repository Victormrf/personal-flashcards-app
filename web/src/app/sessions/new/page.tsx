"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDecks } from "@/hooks/useDeck";
import { useCreateSession } from "@/hooks/useSession";
import { categoryColor } from "@/lib/categoryColor";
import { ArrowLeft, Check } from "lucide-react";

export default function NewSessionPage() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: decks, isLoading } = useDecks();
  const createSession = useCreateSession();

  function toggleDeck(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!name.trim() || selectedIds.size === 0) return;
    createSession.mutate({
      name: name.trim(),
      deck_ids: Array.from(selectedIds),
    });
  }

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-lg w-full mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-[#222225] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">New Study Session</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Select the decks you want to study together.
            </p>
          </div>

          <div className="space-y-5">
            {/* Session name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Session name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="e.g. Interview prep, Backend fundamentals"
              />
            </div>

            {/* Deck selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Decks <span className="text-red-500">*</span>
                {selectedIds.size > 0 && (
                  <span className="ml-2 normal-case font-normal tracking-normal text-indigo-600 dark:text-indigo-400">
                    {selectedIds.size} selected
                  </span>
                )}
              </label>

              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                  <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  Loading decks...
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {decks?.map((deck) => {
                  const colors  = categoryColor(deck.category);
                  const selected = selectedIds.has(deck.id);
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => toggleDeck(deck.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{deck.name}</p>
                        {deck.category && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{deck.category}</p>
                        )}
                      </div>
                      {selected && (
                        <Check size={14} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {createSession.isError && (
              <p className="text-red-500 dark:text-red-400 text-sm font-medium">
                Could not start the session. Check the dashboard before trying again.
              </p>
            )}

            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedIds.size === 0 || createSession.isPending}
              className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md cursor-pointer"
            >
              {createSession.isPending
                ? "Creating..."
                : `Start session with ${selectedIds.size} deck${selectedIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
