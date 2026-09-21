import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deckService, CreateDeckParams, ImportDeckParams } from "@/services/deckService";
import { Deck, DeckSource } from "@/types";

// ── Query keys ──────────────────────────────────────────────────
// Centralised here so every hook that touches decks uses
// the same keys — no risk of typos across page files.

export const deckKeys = {
  all:        ()         => ["decks"]              as const,
  detail:     (id: string) => ["deck", id]         as const,
  categories: ()         => ["categories"]          as const,
};

// ── useDecks — list all decks for the current user ──────────────

export function useDecks() {
  return useQuery<Deck[]>({
    queryKey: deckKeys.all(),
    queryFn:  deckService.list,
  });
}

// ── useDeck — single deck by ID ─────────────────────────────────

export function useDeck(deckId: string) {
  return useQuery<Deck>({
    queryKey: deckKeys.detail(deckId),
    queryFn:  () => deckService.getById(deckId),
    enabled:  !!deckId,
  });
}

// ── useCategories — distinct category values ────────────────────

export function useCategories() {
  return useQuery<string[]>({
    queryKey: deckKeys.categories(),
    queryFn:  deckService.getCategories,
  });
}

// ── useCreateDeck ───────────────────────────────────────────────

export function useCreateDeck() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (params: CreateDeckParams) => deckService.create(params),
    onSuccess: () => {
      // Invalidate the deck list and category list so both
      // update immediately on the dashboard after creation.
      queryClient.invalidateQueries({ queryKey: deckKeys.all() });
      queryClient.invalidateQueries({ queryKey: deckKeys.categories() });
      router.push("/");
    },
  });
}

// ── useDeleteDeck ───────────────────────────────────────────────

export function useDeleteDeck() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (deckId: string) => deckService.delete(deckId),
    onSuccess: () => {
      // Invalidate decks list and due-cards — a deleted deck
      // removes its cards from the study session too.
      queryClient.invalidateQueries({ queryKey: deckKeys.all() });
      queryClient.invalidateQueries({ queryKey: ["due-cards"] });
      router.push("/");
    },
  });
}

// ── useUpdateSources ───────────────────────────────────────────────

export function useUpdateSources(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sources: DeckSource[]) =>
      deckService.updateSources(deckId, sources),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(deckId) });
    },
  });
}

// ── useImportDeck ───────────────────────────────────────────────

export function useImportDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ImportDeckParams) => deckService.import(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckKeys.all() });
      queryClient.invalidateQueries({ queryKey: deckKeys.categories() });
    },
  });
}