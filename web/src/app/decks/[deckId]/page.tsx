"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, Link2, Plus, Trash2, BookOpen, ArrowLeft, X } from "lucide-react";
import { DeckSource } from "@/types";
import { useDeck, useDeleteDeck, useUpdateSources  } from "@/hooks/useDeck";
import { useCards, useCreateCard, useDeleteCard } from "@/hooks/useCards";

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceLabel, setSourceLabel]       = useState("");
  const [sourceURL, setSourceURL]           = useState("");

  const { data: deck } = useDeck(deckId);
  const { data: cards, isLoading } = useCards(deckId);
  const createCard = useCreateCard(deckId);
  const deleteCard = useDeleteCard(deckId);
  const deleteDeck = useDeleteDeck();
  const updateSources = useUpdateSources(deckId);

  const handleCreateCard = () => {
    if (!front.trim() || !back.trim()) return;
    createCard.mutate(
      { front, back },
      {
        onSuccess: () => {
          setFront("");
          setBack("");
          setShowForm(false);
        },
      }
    );
  };

  function handleAddSource() {
    if (!sourceLabel.trim()) return;
    const current = deck?.sources ?? [];
    const updated  = [...current, { label: sourceLabel.trim(), url: sourceURL.trim() }];
    updateSources.mutate(updated, {
      onSuccess: () => {
        setSourceLabel("");
        setSourceURL("");
        setShowSourceForm(false);
      },
    });
  }

  function handleRemoveSource(index: number) {
    const current = deck?.sources ?? [];
    const updated  = current.filter((_, i) => i !== index);
    updateSources.mutate(updated);
  }


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

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-full text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              {showForm ? "Close Form" : "Add Card"}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 font-bold py-3 px-4 rounded-full text-xs transition-all shadow-sm cursor-pointer"
              aria-label="Delete deck"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* ── SOURCES ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Link2 size={12} />
              Sources
            </span>
            <button
              onClick={() => setShowSourceForm(!showSourceForm)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              Add source
            </button>
          </div>

          {deck?.sources && deck.sources.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {deck.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 group">
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                      <ExternalLink size={11} />
                      {source.label}
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{source.label}</span>
                  )}
                  <button onClick={() => handleRemoveSource(idx)} className="text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" aria-label="Remove source">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !showSourceForm && (
              <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                No sources yet — add articles, videos, or books that inspired this deck.
              </p>
            )
          )}

          {showSourceForm && (
            <div className="bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="e.g. Redis docs, System Design Primer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  URL <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-600">optional</span>
                </label>
                <input
                  type="url"
                  value={sourceURL}
                  onChange={(e) => setSourceURL(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleAddSource} disabled={!sourceLabel.trim() || updateSources.isPending} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-full transition-all cursor-pointer">
                  {updateSources.isPending ? "Saving..." : "Add"}
                </button>
                <button onClick={() => { setShowSourceForm(false); setSourceLabel(""); setSourceURL(""); }} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold px-4 py-2 transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add card form */}
        {showForm && (
          <div className="bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 shadow-sm space-y-4">
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
                  onClick={handleCreateCard}
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
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#222225]/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
            <BookOpen size={36} className="mx-auto mb-4 opacity-40 text-indigo-500" />
            <p className="font-bold text-slate-800 dark:text-white text-base">No cards yet</p>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Add your first card to start studying</p>
          </div>
        )}

        <div className="space-y-4">
          {cards?.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-[#222225] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex gap-4 items-start shadow-sm transition-all hover:shadow-md"
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

      {/* Delete deck confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-5">
              <Trash2 size={24} className="text-red-500" />
            </div>

            {/* Text */}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">
              Delete deck?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {deck?.name}
              </span>{" "}
              and all its cards will be permanently deleted. This cannot be undone.
            </p>

            {/* Error */}
            {deleteDeck.isError && (
              <p className="text-red-500 dark:text-red-400 text-xs font-medium text-center mt-3">
                Failed to delete deck. Please try again.
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteDeck.isPending}
                className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 rounded-full text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDeck.mutate(deckId)}
                disabled={deleteDeck.isPending}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-full text-xs transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                {deleteDeck.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}