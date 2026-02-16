import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { indexDocument, getTaskStatus } from '../api/sessions';

const PHASE_PROGRESS = {
  queued: 5,
  pending: 5,
  downloading: 20,
  extracting: 50,
  indexing: 80,
  completed: 100,
  success: 100,
  failure: 0,
};

const PHASE_LABELS = {
  queued: 'Queued...',
  pending: 'Queued...',
  downloading: 'Downloading...',
  extracting: 'Extracting text...',
  indexing: 'Building index...',
  completed: 'Complete',
  success: 'Complete',
  failure: 'Failed',
};

export default function useDocumentIndexing() {
  const [taskId, setTaskId] = useState(null);
  const [phase, setPhase] = useState(null);
  const [progress, setProgress] = useState(0);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const completedRef = useRef(false);

  // Mutation to trigger indexing
  const indexMutation = useMutation({
    mutationFn: ({ sessionId, url, name }) => indexDocument(sessionId, { url, name }),
    onSuccess: (data) => {
      if (data?.task_id) {
        // Async path — got a Celery task_id
        setTaskId(data.task_id);
        setPhase('queued');
        setProgress(5);
        completedRef.current = false;
      } else if (data?.document || data) {
        // Synchronous path — document already indexed
        setDocument(data?.document || data);
        setPhase('completed');
        setProgress(100);
        completedRef.current = true;
      }
    },
    onError: (err) => {
      setError(err?.response?.data?.error || err.message || 'Indexing failed');
      setPhase('failure');
      setProgress(0);
    },
  });

  // Poll task status every 1.5s while task is active
  const isPolling = !!taskId && !completedRef.current;

  const { data: taskData } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskStatus(taskId),
    enabled: isPolling,
    refetchInterval: isPolling ? 1500 : false,
  });

  // Update local state from poll results
  useEffect(() => {
    if (!taskData) return;

    const taskPhase = taskData.phase || taskData.status?.toLowerCase();
    setPhase(taskPhase);
    setProgress(taskData.progress ?? PHASE_PROGRESS[taskPhase] ?? 50);

    if (taskData.status === 'SUCCESS' || taskPhase === 'completed') {
      completedRef.current = true;
      setTaskId(null);
      setDocument(taskData.result?.document || taskData.result);
      setPhase('completed');
      setProgress(100);
    } else if (taskData.status === 'FAILURE') {
      completedRef.current = true;
      setTaskId(null);
      setError(taskData.error || 'Task failed');
      setPhase('failure');
      setProgress(0);
    }
  }, [taskData]);

  const indexFile = useCallback(
    (sessionId, fileEntry) => {
      setError(null);
      setDocument(null);
      setPhase('queued');
      setProgress(5);
      completedRef.current = false;
      indexMutation.mutate({
        sessionId,
        url: fileEntry.uploadedUrl,
        name: fileEntry.fileName,
      });
    },
    [indexMutation]
  );

  const reset = useCallback(() => {
    setTaskId(null);
    setPhase(null);
    setProgress(0);
    setDocument(null);
    setError(null);
    completedRef.current = false;
  }, []);

  return {
    indexFile,
    phase,
    phaseLabel: PHASE_LABELS[phase] || null,
    progress,
    isIndexing: isPolling || indexMutation.isPending,
    error,
    document,
    reset,
  };
}
