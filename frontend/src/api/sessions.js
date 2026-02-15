import apiClient from './client';

export async function listSessions() {
  const res = await apiClient.get('/sessions');
  return res.data.sessions;
}

export async function createSession({ title, persona }) {
  const res = await apiClient.post('/sessions', { title, persona });
  return res.data.session;
}

export async function getSession(sessionId) {
  const res = await apiClient.get(`/sessions/${sessionId}`);
  return res.data.session;
}

export async function deleteSession(sessionId) {
  await apiClient.delete(`/sessions/${sessionId}`);
}

export async function indexDocument(sessionId, { url, name }) {
  const res = await apiClient.post(`/sessions/${sessionId}/documents`, { url, name });
  return res.data.document;
}

export async function sendSessionMessage(sessionId, { question, deepThink }) {
  const res = await apiClient.post(`/sessions/${sessionId}/messages`, {
    question,
    deepThink: !!deepThink,
  });
  return res.data;
}

export async function sendFeedback(messageId, feedback) {
  await apiClient.post(`/messages/${messageId}/feedback`, { feedback });
}

export async function transcribeAudio(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.transcript;
}
