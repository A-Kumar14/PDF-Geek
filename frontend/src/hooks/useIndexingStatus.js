/**
 * useIndexingStatus — Socket.IO hook for real-time document indexing progress.
 *
 * Connects to the backend Socket.IO server and joins the task-specific room.
 * Falls back to null state if the socket can't connect within 3 seconds,
 * signalling to the caller that polling should be used instead.
 */

import { useState, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_TIMEOUT_MS = 3000;

export function useIndexingStatus(taskId) {
  const [phase, setPhase] = useState('queued');
  const [progress, setProgress] = useState(5);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;

    let socket;
    let timedOut = false;

    // Dynamically import socket.io-client to keep initial bundle small
    import('socket.io-client').then(({ io }) => {
      if (timedOut) return;

      socket = io(BACKEND_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        timeout: 2000,
        reconnection: false,
      });

      socketRef.current = socket;

      // Fallback: if no connect within SOCKET_TIMEOUT_MS, mark as not connected
      timeoutRef.current = setTimeout(() => {
        if (!socket.connected) {
          timedOut = true;
          setConnected(false);
          socket.disconnect();
        }
      }, SOCKET_TIMEOUT_MS);

      socket.on('connect', () => {
        clearTimeout(timeoutRef.current);
        setConnected(true);
        socket.emit('join', { room: `task:${taskId}` });
      });

      socket.on('progress', (data) => {
        if (data.task_id && data.task_id !== taskId) return;
        setPhase(data.phase);
        setProgress(data.progress ?? 5);
        if (data.phase === 'completed' && data.document) {
          setDocument(data.document);
        }
        if (data.phase === 'failure') {
          setError(data.error || 'Indexing failed');
        }
      });

      socket.on('connect_error', () => {
        setConnected(false);
      });
    }).catch(() => {
      // socket.io-client not installed yet — caller uses polling fallback
      setConnected(false);
    });

    return () => {
      timedOut = true;
      clearTimeout(timeoutRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [taskId]);

  return { phase, progress, document, error, connected };
}
