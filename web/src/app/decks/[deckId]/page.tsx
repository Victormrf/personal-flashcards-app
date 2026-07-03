"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, Deck } from "@/types";
import { Plus, Trash2, BookOpen } from "lucide-react";

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
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => router.push(`/study/${deckId}`)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <BookOpen size={14} />
          Study
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{deck?.name}</h1>
            {deck?.description && (
              <p className="text-gray-400 text-sm mt-1">{deck.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 border border-gray-700 hover:border-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Add Card
          </button>
        </div>

        {/* Add card form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
            <h3 className="font-medium">New Card</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Front</label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                placeholder="Question or prompt"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Back</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
                placeholder="Answer or explanation"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => createCard.mutate()}
                disabled={!front.trim() || !back.trim() || createCard.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {createCard.isPending ? "Adding..." : "Add Card"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Cards list */}
        {isLoading && (
          <p className="text-gray-400 text-sm">Loading cards...</p>
        )}

        {cards?.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No cards yet</p>
            <p className="text-sm mt-1">Add your first card to start studying</p>
          </div>
        )}

        <div className="space-y-3">
          {cards?.map((card) => (
            <div
              key={card.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {card.front}
                </p>
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {card.back}
                </p>
              </div>
              <button
                onClick={() => deleteCard.mutate(card.id)}
                className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
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