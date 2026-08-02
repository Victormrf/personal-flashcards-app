import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cardService, CreateCardParams } from "@/services/cardService";
import { Card } from "@/types";

export const cardKeys = {
  all: () => ["cards"] as const,
  deck: (deckId: string) => ["cards", deckId] as const,
  due: (deckId?: string) => (deckId ? ["due-cards", deckId] as const : ["due-cards"] as const),
};

export function useCards(deckId: string) {
  return useQuery<Card[]>({
    queryKey: cardKeys.deck(deckId),
    queryFn: () => cardService.getByDeckId(deckId),
    enabled: !!deckId,
  });
}

export function useDueCards(deckId?: string) {
  return useQuery<Card[]>({
    queryKey: cardKeys.due(deckId),
    queryFn: () => cardService.getDue(deckId),
  });
}

export function useCreateCard(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateCardParams) => cardService.create(deckId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.deck(deckId) });
    },
  });
}

export function useDeleteCard(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => cardService.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.deck(deckId) });
    },
  });
}
