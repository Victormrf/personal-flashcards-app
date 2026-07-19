"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, Deck } from "@/types";
import { Plus, Trash2, BookOpen, ArrowLeft } from "lucide-react";

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: deck } = useQuery<Deck>({
    queryKey: ["deck", deckId],
    queryFn: () => api.get(`/decks/${deckId}`).then((r) => r.data),
  });

  const { data: cards, isLoading } = useQuery<Card[]>({
    queryKey: ["cards", deckId],
    queryFn: () => api.get(`/decks/${deckId}/cards`).then((r) => r.data),
  });

  const createCard = useMutation({
    mutationFn: () =>
      api.post(`/decks/${deckId}/cards`, { front, back }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      setFront("");
      setBack("");
      setShowForm(false);
    },
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => api.delete(`/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
    },
  });

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-3xl w-full mx-auto px-6 py-12 flex-1">
        {/* Navigation & Study Action */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          {cards && cards.length > 0 && (
            <button
              onClick={() => router.push(`/study/${deckId}`)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-full text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <BookOpen size={14} />
              Study Now
            </button>
          )}
        </div>

        {/* Deck Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-slate-200/60 dark:border-slate-800/60 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {deck?.name}
            </h1>
            {deck?.description ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                {deck.description}
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-xs italic mt-2">
                No description provided.
              </p>
            )}
          </div>
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-full text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              {showForm ? "Close Form" : "Add Card"}
            </button>
          </div>
        </div>

        {/* Add card form */}
        {showForm && (
          <div className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">New Card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Front</label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none transition-colors text-sm"
                  placeholder="Question or prompt"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Back</label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none transition-colors text-sm"
                  placeholder="Answer or explanation"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => createCard.mutate()}
                  disabled={!front.trim() || !back.trim() || createCard.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer"
                >
                  {createCard.isPending ? "Adding..." : "Add Card"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold px-4 py-2.5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards list */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500 gap-3">
            <div className="w-6 h-6 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading cards...</span>
          </div>
        )}

        {cards?.length === 0 && !showForm && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0d1527]/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
            <BookOpen size={36} className="mx-auto mb-4 opacity-40 text-indigo-500" />
            <p className="font-bold text-slate-800 dark:text-white text-base">No cards yet</p>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Add your first card to start studying</p>
          </div>
        )}

        <div className="space-y-4">
          {cards?.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex gap-4 items-start shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                  Front
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
                  {card.front}
                </p>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Back
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {card.back}
                </p>
              </div>
              <button
                onClick={() => deleteCard.mutate(card.id)}
                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                aria-label="Delete card"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}