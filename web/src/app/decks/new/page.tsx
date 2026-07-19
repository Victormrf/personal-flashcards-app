"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { categoryColor } from "@/lib/categoryColor";
import { ArrowLeft } from "lucide-react";

export default function NewDeckPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: categories } = useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const filteredSuggestions = categories?.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c !== category
  ) ?? [];

  const createDeck = useMutation({
    mutationFn: () => api.post("/decks", { name, description, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.push("/");
    },
  });

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

        <div className="bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-6">
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden z-10 shadow-lg">
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

            {createDeck.isError && (
              <p className="text-red-500 dark:text-red-400 text-sm font-medium">
                Failed to create deck. Please try again.
              </p>
            )}

            <button
              onClick={() => createDeck.mutate()}
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