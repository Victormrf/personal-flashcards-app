"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSession,
  useUpdateSessionName,
  useReplaceSessionDecks,
  useDeleteSession,
} from "@/hooks/useSession";
import { useDecks } from "@/hooks/useDeck";
import { categoryColor } from "@/lib/categoryColor";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router        = useRouter();

  const { data: session, isLoading: sessionLoading } = useSession(sessionId);
  const { data: allDecks,  isLoading: decksLoading  } = useDecks();

  // Editing session name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const updateName = useUpdateSessionName(sessionId);

  // Deck selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const replaceDecks = useReplaceSessionDecks(sessionId);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteSession = useDeleteSession();

  // Initialise selectedIds from the loaded session
  useEffect(() => {
    if (session?.deck_ids) {
      setSelectedIds(new Set(session.deck_ids));
    }
  }, [session]);

  function handleStartNameEdit() {
    setNameInput(session?.name ?? "");
    setEditingName(true);
  }

  function handleSaveName() {
    if (!nameInput.trim() || nameInput === session?.name) {
      setEditingName(false);
      return;
    }
    updateName.mutate(nameInput.trim(), {
      onSuccess: () => setEditingName(false),
    });
  }

  function toggleDeck(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSaveDecks() {
    replaceDecks.mutate(Array.from(selectedIds));
  }

  const hasUnsavedChanges =
    session &&
    JSON.stringify(Array.from(selectedIds).sort()) !==
      JSON.stringify([...session.deck_ids].sort());

  if (sessionLoading || decksLoading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 w-full flex items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-2xl w-full mx-auto px-6 py-12">

        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-8">

          {/* Session name + actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-7">
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-indigo-500 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none text-lg font-extrabold"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={updateName.isPending}
                    className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                    {session.name}
                  </h1>
                  <button
                    onClick={handleStartNameEdit}
                    className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer flex-shrink-0"
                    aria-label="Edit session name"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5">
                {session.deck_ids.length} deck{session.deck_ids.length !== 1 ? "s" : ""} · {selectedIds.size} selected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/sessions/${sessionId}/study`)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-full text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                <BookOpen size={14} />
                Study Session
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2.5 rounded-full bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 hover:border-red-400 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                aria-label="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Deck selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Decks in this session
              </h2>
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveDecks}
                  disabled={selectedIds.size === 0 || replaceDecks.isPending}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  {replaceDecks.isPending ? "Saving..." : "Save changes"}
                </button>
              )}
            </div>

            {selectedIds.size === 0 && (
              <p className="text-xs text-red-400 dark:text-red-500 font-medium">
                A session must have at least one deck.
              </p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {allDecks?.map((deck) => {
                const colors   = categoryColor(deck.category);
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
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {deck.name}
                      </p>
                      {deck.category && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {deck.category}
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {selected && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-5">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white text-center">
              Delete session?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {session.name}
              </span>{" "}
              will be permanently deleted. Your decks and cards are not affected.
            </p>
            {deleteSession.isError && (
              <p className="text-red-500 text-xs font-medium text-center mt-3">
                Failed to delete. Please try again.
              </p>
            )}
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteSession.isPending}
                className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 rounded-full text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteSession.mutate(sessionId, {
                    onSuccess: () => router.push("/"),
                  })
                }
                disabled={deleteSession.isPending}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-full text-xs transition-all shadow-md cursor-pointer"
              >
                {deleteSession.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}