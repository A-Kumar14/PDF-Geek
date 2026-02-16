import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSessions,
  createSession,
  getSession,
  deleteSession,
} from '../api/sessions';

export function useSessionsList() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: listSessions,
  });
}

export function useSession(sessionId) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
