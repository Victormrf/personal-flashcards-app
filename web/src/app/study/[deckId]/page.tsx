"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/types";
import { ArrowLeft } from "lucide-react";

const RATINGS = [
  { value: 1, label: "Again",  color: "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 border border-rose-150 dark:border-rose-900/30",    key: "1" },
  { value: 3, label: "Hard",   color: "bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30", key: "2" },
  { value: 4, label: "Good",   color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30",  key: "3" },
  { value: 5, label: "Easy",   color: "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30",   key: "4" },
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
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading session...</span>
      </div>
    );
  }

  if (sessionDone || !cards || cards.length === 0) {
    return (
      <div className="flex-1 w-full flex items-center justify-center px-6 py-16">
        <div className="text-center py-12 px-6 bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-sm">
          <p className="text-5xl mb-6">🎉</p>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Session complete!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            {!cards || cards.length === 0
              ? "No cards due for this deck."
              : `You reviewed ${cards.length} cards.`}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-2xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-between">
        {/* Progress & Back Bar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              Quit Study
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {currentIndex + 1} / {cards.length} Cards
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-12">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card Study Interface */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <div
            className="w-full min-h-[280px] bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex items-center justify-center cursor-pointer select-none shadow-sm hover:shadow-md transition-all duration-300"
            style={{ perspective: "1000px" }}
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div
              style={{
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                position: "relative",
                width: "100%",
                minHeight: "180px",
              }}
            >
              {/* Front */}
              <div
                style={{ backfaceVisibility: "hidden" }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <p className="text-2xl text-center font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  {card.front}
                </p>
              </div>

              {/* Back */}
              <div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <p className="text-2xl text-center font-semibold text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  {card.back}
                </p>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          {!isFlipped && (
            <p className="mt-6 text-slate-400 dark:text-slate-500 text-xs font-semibold flex items-center gap-1.5">
              <span>Click the card or press</span>
              <kbd className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono">Space</kbd>
              <span>to reveal</span>
            </p>
          )}

          {/* Rating buttons */}
          {isFlipped && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full animate-fade-in">
              {RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() =>
                    reviewMutation.mutate({ cardId: card.id, rating: rating.value })
                  }
                  disabled={reviewMutation.isPending}
                  className={`flex-1 ${rating.color} disabled:opacity-50 font-bold py-3.5 rounded-full transition-all text-xs cursor-pointer shadow-sm`}
                >
                  <span className="block text-sm">{rating.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5 font-normal">Key [{rating.key}]</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}