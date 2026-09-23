import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sessionService, CreateSessionParams } from "@/services/sessionService";
import { StudySession, Card } from "@/types";

export const sessionKeys = {
  all:      () => ["sessions"]           as const,
  detail:   (id: string) => ["session", id] as const,
  study:    (id: string) => ["session-study", id] as const,
};

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

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionService.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
    },
  });
}