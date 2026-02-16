const KEY = 'filegeek-research-notes';
const MAX_NOTES = 100;

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function addNote(noteData) {
  const notes = loadNotes();
  const newNote = {
    id: crypto.randomUUID(),
    question: noteData.question || '',
    answer: noteData.answer || '',
    sources: noteData.sources || [],
    fileName: noteData.fileName || '',
    messageId: noteData.messageId || '',
    pinnedAt: Date.now(),
  };
  notes.unshift(newNote);
  // Cap at MAX_NOTES, trim oldest
  if (notes.length > MAX_NOTES) notes.length = MAX_NOTES;
  saveNotes(notes);
  return notes;
}

export function removeNote(noteId) {
  const notes = loadNotes().filter((n) => n.id !== noteId);
  saveNotes(notes);
  return notes;
}

export function clearAllNotes() {
  saveNotes([]);
  return [];
}
