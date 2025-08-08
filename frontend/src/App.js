import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import PdfViewer from './components/PdfViewer';
import FileUpload from './components/FileUpload';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const [clinicalMode, setClinicalMode] = useState(false);

  // Split sizes (left:right in %)
  const [leftSize, setLeftSize] = useState(50);
  const isResizingRef = useRef(false);

  // ---- Toasts ----
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // ---- API Error ----
  const handleApiError = useCallback((error, customMessage = null) => {
    console.error('API Error:', error);
    let message = customMessage || 'An error occurred while processing your request.';
    if (error.response) {
      const { status, data } = error.response;
      if (status === 429) message = 'Rate limit exceeded. Please wait a moment before trying again.';
      else if (status === 413) message = 'File too large. Please upload a file smaller than 10MB.';
      else if (data && data.error) message = data.error;
    } else if (error.message) {
      message = error.message;
    }
    addToast(message, 'error');
    setError(message);
  }, [addToast]);

  // ---- Regenerate last user prompt ----
  const handleRegenerate = async () => {
    const lastUserMessage = [...chatHistory].reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) return addToast('No previous message to regenerate', 'warning');

    if (!file) return addToast('Upload a PDF to regenerate.', 'warning');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', lastUserMessage.content);
    formData.append('chatHistory', JSON.stringify(chatHistory));

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      const aiResponse = data.answer || "Sorry, no response generated.";
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse, t: Date.now() }]);
      addToast('Response regenerated', 'success');
    } catch (err) {
      handleApiError(err, 'Failed to regenerate response');
    } finally {
      setLoading(false);
    }
  };

  // ---- Copy last assistant response ----
  const handleCopy = () => {
    const lastAssistant = [...chatHistory].reverse().find(msg => msg.role === 'assistant');
    if (!lastAssistant) return addToast('No response to copy', 'warning');
    navigator.clipboard.writeText(lastAssistant.content)
      .then(() => addToast('Copied to clipboard', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };

  // ---- Download chat history ----
  const downloadChatHistory = () => {
    if (chatHistory.length === 0) return addToast('No chat history to download', 'warning');
    try {
      const lines = chatHistory.map((entry, idx) => {
        const who = entry.role === 'user' ? 'You' : 'PDFGeek';
        const ts = entry.t ? ` [${new Date(entry.t).toLocaleString()}]` : '';
        return `${who}${ts}: ${entry.content}`;
      }).join('\n\n');
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chat_history.txt';
      link.click();
      URL.revokeObjectURL(url);
      addToast('Chat history downloaded', 'success');
    } catch {
      addToast('Failed to download chat history', 'error');
    }
  };

  // ---- Ask new question ----
  const handleUpload = async () => {
    if (!file) return addToast('Please select a file first', 'warning');
    if (!question.trim()) return addToast('Please enter a question', 'warning');

    const payload = question;
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', payload);
    formData.append('chatHistory', JSON.stringify(chatHistory));

    setChatHistory(prev => [...prev, { role: 'user', content: payload, t: Date.now() }]);
    setLoading(true);
    setQuestion('');
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      const aiResponse = data.answer || "Sorry, no response generated.";
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse, t: Date.now() }]);
      addToast('Question processed', 'success');
    } catch (err) {
      handleApiError(err, 'Failed to process question');
    } finally {
      setLoading(false);
    }
  };

  // ---- File picker + DnD ----
  const fileInputRef = useRef(null);
  const handleFileClick = (e) => {
    if (e.target === e.currentTarget || e.target.tagName === 'P') fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.includes('pdf')) return addToast('Please select a PDF file', 'error');
    if (selectedFile.size > 10 * 1024 * 1024) return addToast('File too large (max 10MB)', 'error');
    setFile(selectedFile);
    setChatHistory([]);
    setError(null);
    addToast('PDF uploaded', 'success');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.type.includes('pdf')) return addToast('Please drop a PDF file', 'error');
    if (dropped.size > 10 * 1024 * 1024) return addToast('File too large (max 10MB)', 'error');
    setFile(dropped);
    setChatHistory([]);
    setError(null);
    addToast('PDF uploaded', 'success');
  };

  // ---- Split resize handlers ----
  useEffect(() => {
    const onMove = (e) => {
      if (!isResizingRef.current) return;
      const container = document.querySelector('.main-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(80, Math.max(20, (x / rect.width) * 100));
      setLeftSize(pct);
    };
    const stop = () => { isResizingRef.current = false; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stop);
    };
  }, []);

  // ---- Keyboard: Enter to send ----
  const inputRef = useRef(null);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleUpload();
    }
  };

  const miniBtn = (label, onClick, title) => (
    <button className="mini-btn" onClick={onClick} title={title} aria-label={title}>
      {label}
    </button>
  );

  function MarkdownResponse({ markdown }) {
    return (
      <div className="markdown-renderer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`App ${darkMode ? 'dark' : 'light'}`}>
        {/* Toasts */}
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}

        {/* Top Bar */}
        <header className="topbar">
          <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="brand-logo">📄</span>
            <span className="brand-title">PDFGeek</span>
          </div>
          <div className="topbar-actions">
            <button
              className={`chip ${clinicalMode ? 'chip-on' : ''}`}
              onClick={() => setClinicalMode(v => !v)}
              title="Toggle Clinical Trials Mode"
            >
              🏥 Clinical {clinicalMode ? 'On' : 'Off'}
            </button>
            <button
              className="mode-toggle"
              onClick={() => setDarkMode(prev => !prev)}
              title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="main-container">
          {/* LEFT (PDF) */}
          <div
            className="left-panel dropzone"
            style={{ width: `${leftSize}%` }}
            onClick={handleFileClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="hiddenFileInput"
              style={{ display: 'none' }}
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <PdfViewer file={file} key={file?.name} />
                <button
                  className="change-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setChatHistory([]);
                    setError(null);
                    addToast('File removed', 'info');
                  }}
                >
                  Change File
                </button>
              </>
            ) : (
              <div className="empty-drop">
                <div className="empty-illustration">⬆️</div>
                <p>Click or drag a PDF here to upload</p>
                <small>Max 10MB • PDF only</small>
              </div>
            )}
          </div>

          {/* Splitter */}
          <div
            className="splitter"
            onMouseDown={() => { isResizingRef.current = true; document.body.style.userSelect = 'none'; }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
          />

          {/* RIGHT (Chat) */}
          <div className="right-panel" style={{ width: `${100 - leftSize}%` }}>
            <div className="chat-window">
              {error && (
                <div className="error-banner"><strong>Error:</strong> {error}</div>
              )}

              {chatHistory.map((msg, i) => {
                const isLast = i === chatHistory.length - 1;
                const isAssistant = msg.role === 'assistant';
                const ts = msg.t ? new Date(msg.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div key={i} className={`chat-row ${msg.role}`}>
                    {isAssistant && <div className="avatar">🤖</div>}
                    <div className={`bubble ${msg.role}`}>
                      <MarkdownResponse markdown={msg.content} />
                      <div className="meta">{isAssistant ? 'PDFGeek' : 'You'} • {ts}</div>
                      {isAssistant && isLast && (
                        <div className="action-bar">
                          {miniBtn('🔁', handleRegenerate, 'Regenerate')}
                          {miniBtn('📋', handleCopy, 'Copy')}
                          {miniBtn('📥', downloadChatHistory, 'Download chat')}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && <div className="avatar">🫵</div>}
                  </div>
                );
              })}

              {loading && (
                <div className="chat-row assistant">
                  <div className="avatar">🤖</div>
                  <div className="bubble assistant thinking">
                    <div className="inline-spinner"><LoadingSpinner size="small" /></div>
                    <em>PDFGeek is thinking…</em>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar (sticky) */}
            <div className="input-bar">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={clinicalMode ? "Ask about clinical trial details from the PDF…" : "Ask anything about this PDF…"}
                disabled={loading}
              />
              <div className="input-actions">
                <button className="secondary" onClick={downloadChatHistory} title="Download chat">📥</button>
                <button onClick={handleUpload} disabled={loading || !file}>
                  {loading ? 'Sending…' : 'Send ➤'}
                </button>
              </div>
            </div>

            {/* Hidden FileUpload (kept for compatibility with your existing component) */}
            <div style={{ display: 'none' }}>
              <FileUpload
                file={file}
                setFile={setFile}
                question={question}
                setQuestion={setQuestion}
                handleUpload={handleUpload}
                hideFileButton={true}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
