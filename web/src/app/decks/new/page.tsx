"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

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
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">New Deck</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Go fundamentals"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="What is this deck about?"
            />
          </div>

          {createDeck.isError && (
            <p className="text-red-400 text-sm">
              Failed to create deck. Please try again.
            </p>
          )}

          <button
            onClick={() => createDeck.mutate()}
            disabled={!name.trim() || createDeck.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {createDeck.isPending ? "Creating..." : "Create Deck"}
          </button>
        </div>
      </main>
    </div>
  );
}