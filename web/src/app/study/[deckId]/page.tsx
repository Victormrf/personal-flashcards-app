"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/types";

const RATINGS = [
  { value: 1, label: "Again",  color: "bg-red-600 hover:bg-red-500",    key: "1" },
  { value: 3, label: "Hard",   color: "bg-orange-600 hover:bg-orange-500", key: "2" },
  { value: 4, label: "Good",   color: "bg-green-600 hover:bg-green-500",  key: "3" },
  { value: 5, label: "Easy",   color: "bg-blue-600 hover:bg-blue-500",   key: "4" },
];

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionDone, setSessionDone] = useState(false);

  const { data: cards, isLoading } = useQuery<Card[]>({
    queryKey: ["due-cards", deckId],
    queryFn: () =>
      api.get(`/study?deck_id=${deckId}`).then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: number }) =>
      api.post(`/cards/${cardId}/review`, {
        rating,
        response_ms: Date.now() - startTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["due-cards"] });

      const next = currentIndex + 1;
      if (cards && next >= cards.length) {
        setSessionDone(true);
      } else {
        setCurrentIndex(next);
        setIsFlipped(false);
        setStartTime(Date.now());
      }
    },
  });

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isFlipped) {
        if (e.code === "Space") {
          e.preventDefault();
          setIsFlipped(true);
        }
        return;
      }
      const rating = RATINGS.find((r) => r.key === e.key);
      if (rating && cards) {
        reviewMutation.mutate({
          cardId: cards[currentIndex].id,
          rating: rating.value,
        });
      }
    },
    [isFlipped, cards, currentIndex, reviewMutation]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset start time when card changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading cards...</p>
      </div>
    );
  }

  if (sessionDone || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-4xl">🎉</p>
        <h2 className="text-2xl font-bold text-white">Session complete!</h2>
        <p className="text-gray-400">
          {!cards || cards.length === 0
            ? "No cards due for this deck."
            : `You reviewed ${cards.length} cards.`}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {cards.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-1 bg-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-2xl min-h-64 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-center cursor-pointer select-none"
          style={{ perspective: "1000px" }}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <div
            style={{
              transition: "transform 0.5s",
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              position: "relative",
              width: "100%",
              minHeight: "160px",
            }}
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <p className="text-xl text-center font-medium">{card.front}</p>
            </div>

            {/* Back */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <p className="text-xl text-center text-gray-200">{card.back}</p>
            </div>
          </div>
        </div>

        {/* Flip hint */}
        {!isFlipped && (
          <p className="mt-6 text-gray-500 text-sm">
            Click the card or press <kbd className="bg-gray-800 px-2 py-0.5 rounded text-xs">Space</kbd> to reveal
          </p>
        )}

        {/* Rating buttons */}
        {isFlipped && (
          <div className="mt-8 flex gap-3 w-full max-w-2xl">
            {RATINGS.map((rating) => (
              <button
                key={rating.value}
                onClick={() =>
                  reviewMutation.mutate({ cardId: card.id, rating: rating.value })
                }
                disabled={reviewMutation.isPending}
                className={`flex-1 ${rating.color} disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors`}
              >
                <span className="block text-base">{rating.label}</span>
                <span className="block text-xs opacity-70 mt-0.5">[{rating.key}]</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}