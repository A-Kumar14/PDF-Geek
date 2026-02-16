import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendSessionMessage } from '../api/sessions';

export function useSendMessage(sessionId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ question, deepThink }) =>
      sendSessionMessage(sessionId, { question, deepThink }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}
