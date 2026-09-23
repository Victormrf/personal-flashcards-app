import api from "@/lib/api";
import { StudySession, Card } from "@/types";

export interface CreateSessionParams {
  name: string;
  deck_ids: string[];
}

function parseStudySession(value: unknown): StudySession {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid study session response");
  }

  const session = value as Record<string, unknown>;
  if (
    typeof session.id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(session.id) ||
    typeof session.user_id !== "string" ||
    typeof session.name !== "string" ||
    typeof session.created_at !== "string" ||
    !Array.isArray(session.deck_ids) ||
    !session.deck_ids.every((id: unknown) => typeof id === "string")
  ) {
    throw new Error("Invalid study session response");
  }

  return session as unknown as StudySession;
}

export const sessionService = {
  list: (): Promise<StudySession[]> =>
    api.get("/sessions").then((r) => {
      if (!Array.isArray(r.data)) throw new Error("Invalid study sessions response");
      return r.data.map(parseStudySession);
    }),

  create: (params: CreateSessionParams): Promise<StudySession> =>
    api.post("/sessions", params).then((r) => parseStudySession(r.data)),

  delete: (id: string): Promise<void> =>
    api.delete(`/sessions/${id}`).then((r) => r.data),

  getDueCards: (sessionId: string): Promise<Card[]> =>
    api.get(`/sessions/${sessionId}/study`).then((r) => r.data),

  getById: (id: string): Promise<StudySession> =>
    api.get(`/sessions/${id}`).then((r) => r.data),

  updateName: (id: string, name: string): Promise<void> =>
    api.put(`/sessions/${id}/name`, { name }).then((r) => r.data),

  replaceDecks: (id: string, deckIds: string[]): Promise<void> =>
    api.put(`/sessions/${id}/decks`, { deck_ids: deckIds }).then((r) => r.data),
};
