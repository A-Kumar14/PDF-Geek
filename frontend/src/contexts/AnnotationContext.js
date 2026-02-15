import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

export function AnnotationProvider({ children }) {
  const { file } = useFile();
  const fileName = file?.name || null;

  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [notePanelOpen, setNotePanelOpen] = useState(false);

  // Load annotations whenever the active file changes
  useEffect(() => {
    const data = loadAnnotations(fileName);
    setHighlights(data.highlights);
    setNotes(data.notes);
    setComments(data.comments);
  }, [fileName]);

  const sync = useCallback((data) => {
    setHighlights(data.highlights);
    setNotes(data.notes);
    setComments(data.comments);
  }, []);

  const addHighlight = useCallback((highlight) => {
    if (!fileName) return;
    const data = storageAddHighlight(fileName, highlight);
    sync(data);
  }, [fileName, sync]);

  const removeHighlight = useCallback((id) => {
    if (!fileName) return;
    const data = storageRemoveHighlight(fileName, id);
    sync(data);
  }, [fileName, sync]);

  const addNote = useCallback((content) => {
    if (!fileName) return;
    const data = storageAddNote(fileName, content);
    sync(data);
  }, [fileName, sync]);

  const updateNote = useCallback((id, content) => {
    if (!fileName) return;
    const data = storageUpdateNote(fileName, id, content);
    sync(data);
  }, [fileName, sync]);

  const removeNote = useCallback((id) => {
    if (!fileName) return;
    const data = storageRemoveNote(fileName, id);
    sync(data);
  }, [fileName, sync]);

  const addComment = useCallback((comment) => {
    if (!fileName) return;
    const data = storageAddComment(fileName, comment);
    sync(data);
  }, [fileName, sync]);

  const removeComment = useCallback((id) => {
    if (!fileName) return;
    const data = storageRemoveComment(fileName, id);
    sync(data);
  }, [fileName, sync]);

  const clearAll = useCallback(() => {
    if (!fileName) return;
    const empty = { highlights: [], notes: [], comments: [] };
    saveAnnotations(fileName, empty);
    sync(empty);
  }, [fileName, sync]);

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
        notePanelOpen,
        setNotePanelOpen,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}
