import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sessionService, CreateSessionParams } from "@/services/sessionService";
import { StudySession, Card } from "@/types";

export const sessionKeys = {
  all:      () => ["sessions"]           as const,
  detail:   (id: string) => ["session", id] as const,
  study:    (id: string) => ["session-study", id] as const,
};

export function useSession(sessionId: string) {
  return useQuery<StudySession>({
    queryKey: sessionKeys.detail(sessionId),
    queryFn:  () => sessionService.getById(sessionId),
    enabled:  !!sessionId,
  });
}

export function useSessions() {
  return useQuery<StudySession[]>({
    queryKey: sessionKeys.all(),
    queryFn:  sessionService.list,
  });
}

export function useSessionDueCards(sessionId: string) {
  return useQuery<Card[]>({
    queryKey: sessionKeys.study(sessionId),
    queryFn:  () => sessionService.getDueCards(sessionId),
    enabled:  !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (params: CreateSessionParams) => sessionService.create(params),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
      router.push(`/sessions/${session.id}/study`);
    },
  });
}

export function useUpdateSessionName(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => sessionService.updateName(sessionId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
    },
  });
}

export function useReplaceSessionDecks(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckIds: string[]) => sessionService.replaceDecks(sessionId, deckIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionService.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
    },
  });
}