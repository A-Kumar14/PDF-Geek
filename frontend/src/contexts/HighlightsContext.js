import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  loadNotes,
  addNote as storageAddNote,
  removeNote as storageRemoveNote,
  clearAllNotes as storageClearAll,
} from '../utils/researchNotesStorage';

const HighlightsContext = createContext(null);

export function useHighlights() {
  return useContext(HighlightsContext);
}

export function HighlightsProvider({ children }) {
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  useEffect(() => {
    setPinnedNotes(loadNotes());
  }, []);

  const pinNote = useCallback((data) => {
    const updated = storageAddNote(data);
    setPinnedNotes(updated);
  }, []);

  const unpinNote = useCallback((id) => {
    const updated = storageRemoveNote(id);
    setPinnedNotes(updated);
  }, []);

  const clearAllNotes = useCallback(() => {
    const updated = storageClearAll();
    setPinnedNotes(updated);
  }, []);

  const toggleNotesPanel = useCallback(() => {
    setNotesPanelOpen((prev) => !prev);
  }, []);

  const isNotePinned = useCallback(
    (messageId) => pinnedNotes.some((n) => n.messageId === messageId),
    [pinnedNotes],
  );

  const getPinnedNoteByMessageId = useCallback(
    (messageId) => pinnedNotes.find((n) => n.messageId === messageId),
    [pinnedNotes],
  );

  return (
    <HighlightsContext.Provider
      value={{
        pinnedNotes,
        notesPanelOpen,
        toggleNotesPanel,
        pinNote,
        unpinNote,
        clearAllNotes,
        isNotePinned,
        getPinnedNoteByMessageId,
      }}
    >
      {children}
    </HighlightsContext.Provider>
  );
}
