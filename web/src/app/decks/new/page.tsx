"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryColor } from "@/lib/categoryColor";
import { ArrowLeft, ExternalLink, Plus, X } from "lucide-react";
import { useCategories, useCreateDeck } from "@/hooks/useDeck";
import { DeckSource } from "@/types";

export default function NewDeckPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [sources, setSources]           = useState<DeckSource[]>([]);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceLabel, setSourceLabel]   = useState("");
  const [sourceURL, setSourceURL]       = useState("");

  const { data: categories } = useCategories();
  const createDeck = useCreateDeck();

  const filteredSuggestions = categories?.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c !== category
  ) ?? [];

  function handleAddSource() {
    if (!sourceLabel.trim()) return;
    setSources((prev) => [...prev, { label: sourceLabel.trim(), url: sourceURL.trim() }]);
    setSourceLabel("");
    setSourceURL("");
    setShowSourceForm(false);
  }

  function handleRemoveSource(index: number) {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }

  const colors = categoryColor(category);

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
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">New Deck</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Create a new collection of flashcards to study.
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="e.g. Go fundamentals"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none transition-colors text-sm"
                placeholder="What is this deck about?"
              />
            </div>

            {/* Category combobox */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Category
                <span className="normal-case font-normal tracking-normal text-slate-400 dark:text-slate-600 ml-2">
                  optional
                </span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="e.g. Backend, Go, System Design"
              />

              {/* Existing category suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#222225] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden z-10 shadow-lg">
                  {filteredSuggestions.map((cat) => {
                    const c = categoryColor(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={() => {
                          setCategory(cat);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.dot }}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Live color preview */}
              {category && (
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.dot }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-600">
                    preview
                  </span>
                </div>
              )}
            </div>

            {/* Sources */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Sources <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-600">optional</span>
              </label>

              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 group">
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          <ExternalLink size={11} />
                          {source.label}
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{source.label}</span>
                      )}
                      <button onClick={() => handleRemoveSource(idx)} className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showSourceForm ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={sourceLabel}
                    onChange={(e) => setSourceLabel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    placeholder="Label — e.g. Redis docs, Clean Code ch.3"
                  />
                  <input
                    type="url"
                    value={sourceURL}
                    onChange={(e) => setSourceURL(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    placeholder="URL (optional) — https://..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddSource} disabled={!sourceLabel.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer">
                      Add
                    </button>
                    <button onClick={() => { setShowSourceForm(false); setSourceLabel(""); setSourceURL(""); }} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold px-4 py-2 transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowSourceForm(true)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer">
                  <Plus size={12} />
                  Add source
                </button>
              )}
            </div>

            {createDeck.isError && (
              <p className="text-red-500 dark:text-red-400 text-sm font-medium">
                Failed to create deck. Please try again.
              </p>
            )}

            <button
              onClick={() => createDeck.mutate({ name, description, category, sources })}
              disabled={!name.trim() || createDeck.isPending}
              className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md shadow-slate-900/10 dark:shadow-indigo-500/10 cursor-pointer"
            >
              {createDeck.isPending ? "Creating..." : "Create Deck"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}