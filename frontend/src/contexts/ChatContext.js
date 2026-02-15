import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import useChat from '../hooks/useChat';
import { useFile } from './FileContext';
import { usePersona } from './PersonaContext';
import {
  listSessions,
  createSession as apiCreateSession,
  getSession as apiGetSession,
  deleteSession as apiDeleteSession,
  sendSessionMessage,
  indexDocument,
} from '../api/sessions';

const ChatContext = createContext(null);

export function useChatContext() {
  return useContext(ChatContext);
}

const MAX_SESSIONS = 50;
const PHASE_TIMERS = { reading: 1200, analyzing: 2500 };

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(null);
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState(() => {
    const stored = localStorage.getItem('filegeek-sessions');
    return stored ? JSON.parse(stored) : [];
  });
  const [artifacts, setArtifacts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const phaseTimerRef = useRef(null);

  const { sendMessage: apiSendMessage } = useChat();
  const fileCtx = useFile();
  const { personaId } = usePersona();

  // Sync to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem('filegeek-sessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Load sessions from server on mount
  useEffect(() => {
    const token = localStorage.getItem('filegeek-token');
    if (!token) return;

    listSessions()
      .then((serverSessions) => {
        if (serverSessions && serverSessions.length > 0) {
          setChatSessions(serverSessions);
        }
      })
      .catch(() => {
        // Fall back to localStorage sessions
      });
  }, []);

  const startLoadingPhases = useCallback(() => {
    setLoadingPhase('reading');
    phaseTimerRef.current = setTimeout(() => {
      setLoadingPhase('analyzing');
      phaseTimerRef.current = setTimeout(() => {
        setLoadingPhase('formulating');
      }, PHASE_TIMERS.analyzing);
    }, PHASE_TIMERS.reading);
  }, []);

  const stopLoadingPhases = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setLoadingPhase(null);
  }, []);

  const startNewSession = useCallback(async (fileName, fileType) => {
    const token = localStorage.getItem('filegeek-token');
    let session;

    if (token) {
      try {
        session = await apiCreateSession({
          title: fileName || 'Untitled Session',
          persona: personaId || 'academic',
        });
      } catch {
        // Fall back to local session
      }
    }

    if (!session) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      session = {
        id,
        title: fileName || 'Untitled Session',
        persona: personaId || 'academic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
    }

    setActiveSessionId(session.id);
    setMessages([]);
    setArtifacts([]);
    setSuggestions([]);
    setChatSessions((prev) => {
      const updated = [session, ...prev.filter((s) => s.id !== session.id)];
      return updated.slice(0, MAX_SESSIONS);
    });
    return session.id;
  }, [personaId]);

  const loadSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setArtifacts([]);
    setSuggestions([]);

    const token = localStorage.getItem('filegeek-token');
    if (token) {
      try {
        const session = await apiGetSession(sessionId);
        if (session && session.messages) {
          setMessages(session.messages);
          return;
        }
      } catch {
        // Fall back to local
      }
    }

    const localSession = chatSessions.find((s) => s.id === sessionId);
    if (localSession) {
      setMessages(localSession.messages || []);
    }
  }, [chatSessions]);

  const removeSession = useCallback(async (sessionId) => {
    const token = localStorage.getItem('filegeek-token');
    if (token) {
      try {
        await apiDeleteSession(sessionId);
      } catch {
        // Continue with local removal
      }
    }

    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
      setArtifacts([]);
      setSuggestions([]);
    }
  }, [activeSessionId]);

  const saveCurrentSession = useCallback((updatedMessages) => {
    if (!activeSessionId) return;
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: updatedMessages,
              preview: updatedMessages.find((m) => m.role === 'user')?.content?.slice(0, 60) || '',
              updated_at: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeSessionId]);

  const indexDocumentToSession = useCallback(async (sessionId, fileEntry) => {
    if (!fileEntry.uploadedUrl) return;
    try {
      await indexDocument(sessionId, {
        url: fileEntry.uploadedUrl,
        name: fileEntry.fileName,
      });
    } catch (err) {
      console.error('Failed to index document:', err);
    }
  }, []);

  const sendMessage = useCallback(async (question) => {
    if (!fileCtx?.file || !question.trim()) return;

    const allFiles = fileCtx.files || [];
    const completedFiles = allFiles.filter(
      (entry) => entry.uploadStatus === 'complete' && entry.uploadedUrl
    );
    const filesToSend = completedFiles.length > 0
      ? completedFiles
      : allFiles.filter((entry) => entry.localFile);
    if (filesToSend.length === 0) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await startNewSession(fileCtx.file.name, fileCtx.fileType);

      // Index documents into the new session
      for (const entry of completedFiles) {
        await indexDocumentToSession(sessionId, entry);
      }
    }

    const userMsg = { role: 'user', content: question.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setSuggestions([]);
    startLoadingPhases();

    try {
      const token = localStorage.getItem('filegeek-token');
      let result;

      // Try server-backed session message first
      if (token && completedFiles.length > 0) {
        try {
          result = await sendSessionMessage(sessionId, {
            question: question.trim(),
            deepThink: deepThinkEnabled,
          });
        } catch {
          result = null;
        }
      }

      // Fall back to legacy flow
      if (!result) {
        const chatHistory = messages.map(({ role, content }) => ({ role, content }));
        const legacyResult = await apiSendMessage(question, filesToSend, chatHistory, deepThinkEnabled, personaId);
        result = {
          answer: legacyResult.answer,
          sources: legacyResult.sources,
          artifacts: [],
          suggestions: [],
        };
      }

      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        message_id: result.message_id,
        artifacts: result.artifacts,
        suggestions: result.suggestions,
      };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);

      if (result.artifacts?.length > 0) {
        setArtifacts((prev) => [...prev, ...result.artifacts]);
      }
      if (result.suggestions?.length > 0) {
        setSuggestions(result.suggestions);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      const finalMessages = [...newMessages, { role: 'assistant', content: `Error: ${errorMsg}` }];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } finally {
      setLoading(false);
      stopLoadingPhases();
    }
  }, [fileCtx, messages, activeSessionId, deepThinkEnabled, personaId, apiSendMessage, startNewSession, saveCurrentSession, startLoadingPhases, stopLoadingPhases, indexDocumentToSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
    setArtifacts([]);
    setSuggestions([]);
  }, []);

  const clearAllSessions = useCallback(async () => {
    const token = localStorage.getItem('filegeek-token');
    if (token) {
      for (const s of chatSessions) {
        try { await apiDeleteSession(s.id); } catch { /* ignore */ }
      }
    }
    setChatSessions([]);
    setMessages([]);
    setActiveSessionId(null);
    setArtifacts([]);
    setSuggestions([]);
    localStorage.removeItem('filegeek-sessions');
  }, [chatSessions]);

  const toggleDeepThink = useCallback(() => {
    setDeepThinkEnabled((prev) => !prev);
  }, []);

  const clearArtifacts = useCallback(() => {
    setArtifacts([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        loadingPhase,
        deepThinkEnabled,
        toggleDeepThink,
        sendMessage,
        clearMessages,
        clearAllSessions,
        chatSessions,
        activeSessionId,
        startNewSession,
        loadSession,
        removeSession,
        artifacts,
        clearArtifacts,
        suggestions,
        setSuggestions,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
