"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function NewDeckPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createDeck = useMutation({
    mutationFn: () => api.post("/decks", { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      router.push("/");
    },
  });

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