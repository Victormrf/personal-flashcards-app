import api from "@/lib/api";
import { Card } from "@/types";

export interface CreateCardParams {
  front: string;
  back: string;
}

export const cardService = {
  getByDeckId: (deckId: string): Promise<Card[]> =>
    api.get(`/decks/${deckId}/cards`).then((r) => r.data),

  getDue: (deckId?: string): Promise<Card[]> =>
    api.get(`/study${deckId ? `?deck_id=${deckId}` : ""}`).then((r) => r.data),

  create: (deckId: string, params: CreateCardParams): Promise<Card> =>
    api.post(`/decks/${deckId}/cards`, params).then((r) => r.data),

  batchCreate: (deckId: string, cards: CreateCardParams[]): Promise<void> =>
    api.post(`/decks/${deckId}/cards/batch`, { cards }).then((r) => r.data),

  delete: (cardId: string): Promise<void> =>
    api.delete(`/cards/${cardId}`).then((r) => r.data),
};
