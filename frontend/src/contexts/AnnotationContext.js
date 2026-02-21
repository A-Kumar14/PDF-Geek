import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  loadAnnotations,
  saveAnnotations,
  addHighlight as storageAddHighlight,
  removeHighlight as storageRemoveHighlight,
  addNote as storageAddNote,
  updateNote as storageUpdateNote,
  removeNote as storageRemoveNote,
  addComment as storageAddComment,
  removeComment as storageRemoveComment,
} from '../utils/annotationStorage';
import { useFile } from './FileContext';

const AnnotationContext = createContext(null);

export function useAnnotations() {
  return useContext(AnnotationContext);
}

const MAX_HISTORY = 50;

export function AnnotationProvider({ children }) {
  const { file } = useFile();
  const fileName = file?.name || null;

  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [notePanelOpen, setNotePanelOpen] = useState(false);

  // Always-current snapshot of state (updated synchronously after each setState)
  const stateRef = useRef({ highlights: [], notes: [], comments: [] });
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current = { highlights, notes, comments };
  }, [highlights, notes, comments]);

  // Load annotations when file changes; reset history
  useEffect(() => {
    const data = loadAnnotations(fileName);
    setHighlights(data.highlights);
    setNotes(data.notes);
    setComments(data.comments);
    stateRef.current = data;
    undoStack.current = [];
    redoStack.current = [];
  }, [fileName]);

  // Deep-copy the current state into the undo stack and clear redo
  const pushUndo = useCallback(() => {
    const { highlights: h, notes: n, comments: c } = stateRef.current;
    const snap = {
      highlights: h.map((x) => ({ ...x })),
      notes: n.map((x) => ({ ...x })),
      comments: c.map((x) => ({ ...x })),
    };
    undoStack.current = [...undoStack.current.slice(-(MAX_HISTORY - 1)), snap];
    redoStack.current = [];
  }, []);

  // Apply a snapshot to React state + localStorage
  const applySnapshot = useCallback((snap) => {
    setHighlights(snap.highlights);
    setNotes(snap.notes);
    setComments(snap.comments);
    stateRef.current = snap;
    if (fileName) saveAnnotations(fileName, snap);
  }, [fileName]);

  const sync = useCallback((data) => {
    setHighlights(data.highlights);
    setNotes(data.notes);
    setComments(data.comments);
    stateRef.current = data;
  }, []);

  const addHighlight = useCallback((highlight) => {
    if (!fileName) return;
    pushUndo();
    const data = storageAddHighlight(fileName, highlight);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const removeHighlight = useCallback((id) => {
    if (!fileName) return;
    pushUndo();
    const data = storageRemoveHighlight(fileName, id);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const addNote = useCallback((content) => {
    if (!fileName) return;
    pushUndo();
    const data = storageAddNote(fileName, content);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const updateNote = useCallback((id, content) => {
    if (!fileName) return;
    pushUndo();
    const data = storageUpdateNote(fileName, id, content);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const removeNote = useCallback((id) => {
    if (!fileName) return;
    pushUndo();
    const data = storageRemoveNote(fileName, id);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const addComment = useCallback((comment) => {
    if (!fileName) return;
    pushUndo();
    const data = storageAddComment(fileName, comment);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const removeComment = useCallback((id) => {
    if (!fileName) return;
    pushUndo();
    const data = storageRemoveComment(fileName, id);
    sync(data);
  }, [fileName, sync, pushUndo]);

  const clearAll = useCallback(() => {
    if (!fileName) return;
    pushUndo();
    const empty = { highlights: [], notes: [], comments: [] };
    saveAnnotations(fileName, empty);
    sync(empty);
  }, [fileName, sync, pushUndo]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    // Save current state for redo
    const { highlights: h, notes: n, comments: c } = stateRef.current;
    const current = {
      highlights: h.map((x) => ({ ...x })),
      notes: n.map((x) => ({ ...x })),
      comments: c.map((x) => ({ ...x })),
    };
    redoStack.current = [...redoStack.current, current];
    // Pop and apply previous state
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    applySnapshot(prev);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    // Save current state for undo
    const { highlights: h, notes: n, comments: c } = stateRef.current;
    const current = {
      highlights: h.map((x) => ({ ...x })),
      notes: n.map((x) => ({ ...x })),
      comments: c.map((x) => ({ ...x })),
    };
    undoStack.current = [...undoStack.current, current];
    // Pop and apply next state
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    applySnapshot(next);
  }, [applySnapshot]);

  return (
    <AnnotationContext.Provider
      value={{
        highlights,
        notes,
        comments,
        addHighlight,
        removeHighlight,
        addNote,
        updateNote,
        removeNote,
        addComment,
        removeComment,
        clearAll,
        undo,
        redo,
        notePanelOpen,
        setNotePanelOpen,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}
