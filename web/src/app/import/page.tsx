"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { categoryColor } from "@/lib/categoryColor";
import { parseAnkiFile, ParsedCard } from "@/lib/parseAnkiFile";
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

type Step = "upload" | "preview" | "importing" | "done";

export default function ImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [deckName, setDeckName] = useState("");
  const [category, setCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const { data: categories } = useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const filteredSuggestions = categories?.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c !== category
  ) ?? [];

  const colors = categoryColor(category);

  // Step 1 — parse the file on selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDeckName(file.name.replace(/\.[^.]+$/, "")); // use filename as default deck name

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const result = parseAnkiFile(content);

      if (result.cards.length === 0) {
        setError("No valid cards found. Make sure each line has a front and back separated by a tab, semicolon, or comma.");
        return;
      }

      setParsedCards(result.cards);
      setSkipped(result.skipped);
      setError("");
      setStep("preview");
    };
    reader.readAsText(file);
  }

  // Step 2 — create deck then batch create cards
  const importMutation = useMutation({
    mutationFn: async () => {
      // Create the deck first
      const deckRes = await api.post("/decks", {
        name: deckName,
        description: `Imported from ${fileName}`,
        category,
      });
      const deckId = deckRes.data.id;

      // Batch create all cards
      await api.post(`/decks/${deckId}/cards/batch`, {
        cards: parsedCards.map((c) => ({ front: c.front, back: c.back })),
      });

      return deckId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setStep("done");
    },
    onError: () => {
      setError("Import failed. Please try again.");
    },
  });

  return (
    <div className="flex-1 w-full flex flex-col justify-start">
      <main className="max-w-2xl w-full mx-auto px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-[#222225] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm">

          {/* ── STEP: UPLOAD ── */}
          {step === "upload" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                  Import a Deck
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Import cards from an Anki export file (.txt, .csv, .tsv)
                </p>
              </div>

              {/* File drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors">
                  <Upload size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Click to select a file
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    .txt, .csv, .tsv — tab, semicolon, or comma separated
                  </p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.tsv"
                className="hidden"
                onChange={handleFileChange}
              />

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Format hint */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Expected format
                </p>
                <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
{`What does defer do in Go?\tRuns at end of function scope
What is a goroutine?\tA lightweight thread managed by Go
What is an interface?\tA set of method signatures`}
                </pre>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Lines starting with # are treated as comments and skipped.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === "preview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                  Preview Import
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <FileText size={14} />
                    {fileName}
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {parsedCards.length} cards found
                  </span>
                  {skipped > 0 && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-sm text-slate-400">{skipped} skipped</span>
                    </>
                  )}
                </div>
              </div>

              {/* Deck name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Deck Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
                  placeholder="e.g. Go, System Design, Frontend"
                />

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
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {category && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {category}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-600">preview</span>
                  </div>
                )}
              </div>

              {/* Card preview table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  First 5 cards
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/2">Front</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/2">Back</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedCards.slice(0, 5).map((card, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                        >
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-0">
                            <span className="block truncate">{card.front}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-0">
                            <span className="block truncate">{card.back}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedCards.length > 5 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                    and {parsedCards.length - 5} more cards
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 rounded-full text-xs transition-all"
                >
                  Choose different file
                </button>
                <button
                  onClick={() => importMutation.mutate()}
                  disabled={!deckName.trim() || importMutation.isPending}
                  className="flex-2 flex-1 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-full text-xs transition-all shadow-md cursor-pointer"
                >
                  {importMutation.isPending
                    ? `Importing ${parsedCards.length} cards...`
                    : `Import ${parsedCards.length} cards`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Import complete
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  {parsedCards.length} cards imported into <span className="font-bold text-slate-700 dark:text-slate-300">{deckName}</span>
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setStep("upload");
                    setParsedCards([]);
                    setDeckName("");
                    setCategory("");
                    setFileName("");
                  }}
                  className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 px-6 rounded-full text-xs transition-all"
                >
                  Import another
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full text-xs transition-all shadow-md"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}