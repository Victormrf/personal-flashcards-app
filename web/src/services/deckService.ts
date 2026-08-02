import api from "@/lib/api";
import { Deck } from "@/types";

export interface CreateDeckParams {
  name: string;
  description?: string;
  category?: string;
}

export interface ImportDeckParams {
  name: string;
  category?: string;
  fileName: string;
  cards: Array<{ front: string; back: string }>;
}

export const deckService = {
  list: (): Promise<Deck[]> =>
    api.get("/decks").then((r) => r.data),

  getById: (id: string): Promise<Deck> =>
    api.get(`/decks/${id}`).then((r) => r.data),

  create: (params: CreateDeckParams): Promise<Deck> =>
    api.post("/decks", params).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/decks/${id}`).then((r) => r.data),

  getCategories: (): Promise<string[]> =>
    api.get("/categories").then((r) => r.data),

  import: async (params: ImportDeckParams): Promise<string> => {
    const deckRes = await api.post("/decks", {
      name: params.name,
      description: `Imported from ${params.fileName}`,
      category: params.category,
    });
    const deckId = deckRes.data.id;
    await api.post(`/decks/${deckId}/cards/batch`, {
      cards: params.cards,
    });
    return deckId;
  },
};