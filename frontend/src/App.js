import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import PdfViewer from './components/PdfViewer';
import ErrorBoundary from './components/ErrorBoundary';
<<<<<<< HEAD
import Toast from './components/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.min.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const UPLOAD_PHASES = ['idle', 'extracting', 'embedding', 'answering'];
=======
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [lightMode, setLightMode] = useState(false);
  const darkMode = !lightMode;
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const [clinicalMode, setClinicalMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [collapseLeft, setCollapseLeft] = useState(false);
  const [collapseRight, setCollapseRight] = useState(false);

  const [leftSize, setLeftSize] = useState(50);
  const isResizingRef = useRef(false);
  const chatWindowRef = useRef(null);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
=======
  const [lightMode, setLightMode] = useState(false); // false = dark by default
  const darkMode = !lightMode; // computed
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const [clinicalMode, setClinicalMode] = useState(false);

  const [leftSize, setLeftSize] = useState(50);
  const isResizingRef = useRef(false);
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

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

<<<<<<< HEAD
  const handleCopyFor = useCallback((content) => {
    if (!content) return addToast('Nothing to copy', 'warning');
    navigator.clipboard.writeText(content)
      .then(() => addToast('Copied to clipboard', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  }, [addToast]);

  const handleRegenerateFor = useCallback(async (userMessageIndex) => {
    const userMsg = chatHistory[userMessageIndex];
    if (!userMsg || userMsg.role !== 'user' || !file) return addToast('Cannot regenerate', 'warning');
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', userMsg.content);
    formData.append('chatHistory', JSON.stringify(chatHistory.slice(0, userMessageIndex)));
    setLoading(true);
    setError(null);
    setUploadPhase('extracting');
    progressIntervalRef.current = setInterval(() => {
      setUploadPhase(p => {
        const i = UPLOAD_PHASES.indexOf(p);
        if (i < 0 || i >= UPLOAD_PHASES.length - 1) return p;
        return UPLOAD_PHASES[i + 1];
      });
    }, 800);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      clearInterval(progressIntervalRef.current);
      setUploadPhase('idle');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      const aiResponse = data.answer || "Sorry, no response generated.";
      const sources = Array.isArray(data.sources) ? data.sources : [];
      const newEntry = { role: 'assistant', content: aiResponse, citations: sources, t: Date.now() };
      setChatHistory(prev => {
        const next = [...prev];
        const replaceFrom = userMessageIndex + 1;
        const afterAssistant = next.findIndex((m, i) => i >= replaceFrom && m.role === 'assistant');
        const end = afterAssistant >= 0 ? afterAssistant : next.length;
        next.splice(replaceFrom, end - replaceFrom, newEntry);
        return next;
      });
      addToast('Response regenerated', 'success');
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      setUploadPhase('idle');
=======
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
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
      handleApiError(err, 'Failed to regenerate response');
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  }, [chatHistory, file, addToast, handleApiError]);
=======
  };

  const handleCopy = () => {
    const lastAssistant = [...chatHistory].reverse().find(msg => msg.role === 'assistant');
    if (!lastAssistant) return addToast('No response to copy', 'warning');
    navigator.clipboard.writeText(lastAssistant.content)
      .then(() => addToast('Copied to clipboard', 'success'))
      .catch(() => addToast('Failed to copy', 'error'));
  };
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f

  const downloadChatHistory = () => {
    if (chatHistory.length === 0) return addToast('No chat history to download', 'warning');
    try {
      const lines = chatHistory.map((entry) => {
        const who = entry.role === 'user' ? 'You' : 'PDFGeek';
        const ts = entry.t ? ` [${new Date(entry.t).toLocaleString()}]` : '';
<<<<<<< HEAD
        let text = `${who}${ts}: ${entry.content}`;
        if (entry.role === 'assistant' && entry.citations?.length) {
          text += '\n  [Sources: ' + entry.citations.map(s => {
          const ex = (s.excerpt || '').slice(0, 80);
          return `Source ${s.index}: ${ex}${(s.excerpt || '').length > 80 ? '…' : ''}`;
        }).join('; ') + ']';
        }
        return text;
=======
        return `${who}${ts}: ${entry.content}`;
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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

  const handleUpload = async () => {
    if (!file) return addToast('Please select a file first', 'warning');
    if (!question.trim()) return addToast('Please enter a question', 'warning');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', question);
    formData.append('chatHistory', JSON.stringify(chatHistory));

    setChatHistory(prev => [...prev, { role: 'user', content: question, t: Date.now() }]);
    setLoading(true);
    setQuestion('');
    setError(null);
<<<<<<< HEAD
    setUploadPhase('extracting');
    progressIntervalRef.current = setInterval(() => {
      setUploadPhase(p => {
        const i = UPLOAD_PHASES.indexOf(p);
        if (i < 0 || i >= UPLOAD_PHASES.length - 1) return p;
        return UPLOAD_PHASES[i + 1];
      });
    }, 800);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      clearInterval(progressIntervalRef.current);
      setUploadPhase('idle');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      const aiResponse = data.answer || "Sorry, no response generated.";
      const sources = Array.isArray(data.sources) ? data.sources : [];
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        citations: sources,
        t: Date.now(),
      }]);
      addToast('Question processed', 'success');
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      setUploadPhase('idle');
=======

    try {
      const res = await fetch('http://localhost:5000/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      const aiResponse = data.answer || "Sorry, no response generated.";
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse, t: Date.now() }]);
      addToast('Question processed', 'success');
    } catch (err) {
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
      handleApiError(err, 'Failed to process question');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const fileInputRef = useRef(null);
  const handleFileClick = (e) => {
    if (e.target === e.currentTarget || e.target.tagName === 'P') fileInputRef.current?.click();
  };

>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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

<<<<<<< HEAD
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setDragOver(true);
  };

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

<<<<<<< HEAD
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
=======
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.type.includes('pdf')) return addToast('Please drop a PDF file', 'error');
    if (dropped.size > 10 * 1024 * 1024) return addToast('File too large (max 10MB)', 'error');
    setFile(dropped);
    setChatHistory([]);
    setError(null);
    addToast('PDF uploaded', 'success');
  };

<<<<<<< HEAD
  // Scroll chat to bottom when new message or loading state changes
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatHistory.length, loading]);

  // Keyboard shortcuts: Cmd/Ctrl+K clear chat, Cmd/Ctrl+U open file
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setChatHistory([]);
        addToast('Chat cleared', 'info');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addToast]);

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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

  const inputRef = useRef(null);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleUpload();
    }
  };

<<<<<<< HEAD
  function MarkdownResponse({ markdown }) {
    return (
      <div className="markdown-renderer">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
=======
  const miniBtn = (label, onClick, title) => (
    <button className="mini-btn" onClick={onClick} title={title} aria-label={title}>
      {label}
    </button>
  );

  function MarkdownResponse({ markdown }) {
    return (
      <div className="markdown-renderer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }

<<<<<<< HEAD
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ErrorBoundary>
      <div className={`App ${darkMode ? 'dark' : 'light'} ${clinicalMode ? 'clinical-mode' : ''}`}>
=======
  return (
    <ErrorBoundary>
      <div className={`App ${darkMode ? 'dark' : 'light'}`}>
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}

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
              onClick={() => setLightMode(prev => !prev)}
              title={lightMode ? 'Switch to Dark' : 'Switch to Light'}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <div className="main-container">
          <div
<<<<<<< HEAD
            className={`left-panel dropzone ${dragOver ? 'drag-over' : ''} ${collapseLeft ? 'collapsed' : ''}`}
            style={collapseLeft ? {} : collapseRight ? { flex: 1, minWidth: 0 } : { width: `${leftSize}%` }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
=======
            className="left-panel dropzone"
            style={{ width: `${leftSize}%` }}
            onClick={handleFileClick}
            onDragOver={handleDragOver}
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
<<<<<<< HEAD
              id="pdf-file-input"
              type="file"
              className="visually-hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {collapseLeft ? (
              <button
                type="button"
                className="panel-expand-btn"
                onClick={() => setCollapseLeft(false)}
                title="Expand PDF viewer"
                aria-label="Expand PDF viewer"
              >
                📄
              </button>
            ) : (
              <>
              <button
                type="button"
                className="panel-collapse-btn left"
                onClick={() => setCollapseLeft(true)}
                title="Collapse PDF viewer"
                aria-label="Collapse PDF viewer"
              >
                ← 📄
              </button>
            {file ? (
              <>
                <div className="pdf-panel-sticky-header">
                  <div className="file-preview-card">
                    <span className="file-preview-name" title={file.name}>{file.name}</span>
                    <span className="file-preview-size">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      className="change-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setChatHistory([]);
                        setError(null);
                        addToast('File removed', 'info');
                      }}
                      title="Remove file"
                    >
                      Change File
                    </button>
                  </div>
                </div>
                <div className="pdf-panel-content">
                  <PdfViewer file={file} key={file?.name} darkMode={darkMode} />
                </div>
              </>
            ) : (
              <label htmlFor="pdf-file-input" className="dropzone-label">
                <div className="empty-drop">
                  <div className="empty-illustration">⬆️</div>
                  <p>Click or drag a PDF here to upload</p>
                  <small>Max 10MB • PDF only</small>
                </div>
              </label>
            )}
              </>
=======
              type="file"
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
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
            )}
          </div>

          <div
            className="splitter"
<<<<<<< HEAD
            style={{ display: collapseLeft || collapseRight ? 'none' : undefined }}
=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
            onMouseDown={() => { isResizingRef.current = true; document.body.style.userSelect = 'none'; }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
          />

<<<<<<< HEAD
          <div className={`right-panel ${collapseRight ? 'collapsed' : ''}`} style={collapseRight ? {} : collapseLeft ? { flex: 1, minWidth: 0 } : { width: `${100 - leftSize}%` }}>
            {collapseRight ? (
              <button
                type="button"
                className="panel-expand-btn"
                onClick={() => setCollapseRight(false)}
                title="Expand chat"
                aria-label="Expand chat"
              >
                💬
              </button>
            ) : (
              <>
            <div className="chat-window" ref={chatWindowRef}>
=======
          <div className="right-panel" style={{ width: `${100 - leftSize}%` }}>
            <div className="chat-window">
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
              {error && (
                <div className="error-banner"><strong>Error:</strong> {error}</div>
              )}

              {chatHistory.map((msg, i) => {
<<<<<<< HEAD
                const prev = chatHistory[i - 1];
                const groupContinue = prev && prev.role === msg.role;
                const isAssistant = msg.role === 'assistant';
                const ts = msg.t ? new Date(msg.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const userMsgIndex = isAssistant ? chatHistory.slice(0, i).map((m, idx) => ({ m, idx })).reverse().find(x => x.m.role === 'user')?.idx : null;
                return (
                  <div key={i} className={`chat-row ${msg.role} ${groupContinue ? 'group-continue' : ''}`}>
                    {isAssistant && !groupContinue && <div className="avatar">🤖</div>}
                    {isAssistant && groupContinue && <div className="avatar avatar-spacer" aria-hidden />}
                    <div className={`bubble ${msg.role}`}>
                      <MarkdownResponse markdown={msg.content} />
                      {isAssistant && msg.citations && msg.citations.length > 0 && (
                        <details className="citations">
                          <summary className="citations-heading">
                            Answer based on {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
                          </summary>
                          <ul className="citations-list">
                            {msg.citations.map((src, j) => (
                              <li key={j} className="citation-item">
                                <span className="citation-label">Source {src.index}</span>
                                <span className="citation-excerpt">{src.excerpt}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <div className="meta">{isAssistant ? 'PDFGeek' : 'You'} • {ts}</div>
                      {isAssistant && (
                        <div className="action-bar">
                          {userMsgIndex !== null && (
                            <button type="button" className="mini-btn" onClick={() => handleRegenerateFor(userMsgIndex)} title="Regenerate">🔁</button>
                          )}
                          <button type="button" className="mini-btn" onClick={() => handleCopyFor(msg.content)} title="Copy">📋</button>
                          {i === chatHistory.length - 1 && (
                            <button type="button" className="mini-btn" onClick={downloadChatHistory} title="Download chat">📥</button>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && !groupContinue && <div className="avatar">🫵</div>}
                    {msg.role === 'user' && groupContinue && <div className="avatar avatar-spacer" aria-hidden />}
=======
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
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
                  </div>
                );
              })}

              {loading && (
                <div className="chat-row assistant">
                  <div className="avatar">🤖</div>
                  <div className="bubble assistant thinking">
<<<<<<< HEAD
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                    <div className="skeleton-lines">
                      <div className="skeleton-line w90" />
                      <div className="skeleton-line w70" />
                      <div className="skeleton-line w80" />
                    </div>
                    <em className="thinking-label">{uploadPhase !== 'idle' ? `PDFGeek is ${uploadPhase}…` : 'PDFGeek is thinking…'}</em>
=======
                    <div className="inline-spinner"><LoadingSpinner size="small" /></div>
                    <em>PDFGeek is thinking…</em>
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
                  </div>
                </div>
              )}
            </div>

<<<<<<< HEAD
            {loading && uploadPhase !== 'idle' && (
              <div className="progress-bar-wrap">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: uploadPhase === 'extracting' ? '33%' : uploadPhase === 'embedding' ? '66%' : '100%',
                    }}
                  />
                </div>
                <span className="progress-label">
                  {uploadPhase === 'extracting' && 'Extracting text…'}
                  {uploadPhase === 'embedding' && 'Generating embeddings…'}
                  {uploadPhase === 'answering' && 'Generating answer…'}
                </span>
              </div>
            )}

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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
<<<<<<< HEAD
              <button
                type="button"
                className="panel-collapse-btn right"
                onClick={() => setCollapseRight(true)}
                title="Collapse chat"
                aria-label="Collapse chat"
              >
                💬 →
              </button>
              </>
            )}
=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
