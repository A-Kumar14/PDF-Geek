const PREFIX = 'filegeek-annotations-';

function getKey(fileName) {
  return PREFIX + fileName;
}

function getEmptyStore() {
  return { highlights: [], notes: [], comments: [] };
}

export function loadAnnotations(fileName) {
  if (!fileName) return getEmptyStore();
  try {
    const raw = localStorage.getItem(getKey(fileName));
    if (!raw) return getEmptyStore();
    const parsed = JSON.parse(raw);
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return getEmptyStore();
  }
}

export function saveAnnotations(fileName, data) {
  if (!fileName) return;
  localStorage.setItem(getKey(fileName), JSON.stringify(data));
}

export function addHighlight(fileName, highlight) {
  const data = loadAnnotations(fileName);
  data.highlights.push({ ...highlight, id: crypto.randomUUID(), createdAt: Date.now() });
  saveAnnotations(fileName, data);
  return data;
}

export function removeHighlight(fileName, highlightId) {
  const data = loadAnnotations(fileName);
  data.highlights = data.highlights.filter((h) => h.id !== highlightId);
  saveAnnotations(fileName, data);
  return data;
}

export function addNote(fileName, content) {
  const data = loadAnnotations(fileName);
  data.notes.push({ id: crypto.randomUUID(), content, createdAt: Date.now() });
  saveAnnotations(fileName, data);
  return data;
}

export function updateNote(fileName, noteId, content) {
  const data = loadAnnotations(fileName);
  const note = data.notes.find((n) => n.id === noteId);
  if (note) note.content = content;
  saveAnnotations(fileName, data);
  return data;
}

export function removeNote(fileName, noteId) {
  const data = loadAnnotations(fileName);
  data.notes = data.notes.filter((n) => n.id !== noteId);
  saveAnnotations(fileName, data);
  return data;
}

export function addComment(fileName, comment) {
  const data = loadAnnotations(fileName);
  data.comments.push({ ...comment, id: crypto.randomUUID(), createdAt: Date.now() });
  saveAnnotations(fileName, data);
  return data;
}

export function removeComment(fileName, commentId) {
  const data = loadAnnotations(fileName);
  data.comments = data.comments.filter((c) => c.id !== commentId);
  saveAnnotations(fileName, data);
  return data;
}
