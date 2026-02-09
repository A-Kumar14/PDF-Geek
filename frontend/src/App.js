import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ClipLoader } from 'react-spinners';
import PdfViewer from './components/PdfViewer';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QUICK_ACTIONS = [
  'Summarize this document',
  'List the key points',
  'Explain in simple terms',
  'Extract all dates and numbers',
];

function App() {
  const [file, setFile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // percent
  const chatEndRef = useRef(null);
  const splitterDragging = useRef(false);
  const fileInputRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Splitter drag logic
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!splitterDragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setSplitPos(Math.max(20, Math.min(80, pct)));
    };
    const onMouseUp = () => {
      splitterDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleSplitterDown = () => {
    splitterDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // File handling
  const handleFileSelect = useCallback((selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessages([]);
    }
  }, []);

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = () => {
    setFile(null);
    setMessages([]);
  };

  // Send question
  const sendQuestion = async (question) => {
    if (!file || !question.trim()) return;

    const userMsg = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const chatHistory = messages.map(({ role, content }) => ({ role, content }));
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('question', question.trim());
      formData.append('chatHistory', JSON.stringify(chatHistory));

      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.answer || 'No response received.',
        sources: res.data.sources || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(inputText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(inputText);
    }
  };

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      {/* Top bar */}
      <div className="topbar">
        <div className="brand" onClick={removeFile}>
          <span className="brand-logo">PDF</span>
          <span className="brand-title">PDFGeek</span>
        </div>
        <div className="topbar-actions">
          {file && (
            <button
              className="pdf-toolbar-btn"
              onClick={removeFile}
              title="Remove PDF"
            >
              New
            </button>
          )}
          <button
            className="pdf-toolbar-btn"
            onClick={() => setDarkMode((d) => !d)}
            title="Toggle dark mode"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Main split layout */}
      <div className="main-container" style={{ height: 'calc(100vh - 45px)' }}>
        {/* Left panel – PDF viewer / dropzone */}
        <div
          className={`left-panel ${dragOver ? 'drag-over' : ''}`}
          style={{ flex: `0 0 ${splitPos}%` }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <PdfViewer file={file} darkMode={darkMode} />
          ) : (
            <div
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="visually-hidden"
                onChange={handleFileChange}
              />
              <p style={{ fontSize: '2.5rem', margin: 0 }}>+</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Drop a PDF here or click to browse
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Max 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Splitter */}
        <div className="splitter" onMouseDown={handleSplitterDown} />

        {/* Right panel – Chat */}
        <div className="right-panel" style={{ flex: 1 }}>
          {/* Chat messages */}
          <div className="chat-window">
            {messages.length === 0 && (
              <div className="welcome-message">
                <h2 style={{ marginBottom: '0.5rem' }}>
                  {file ? 'Ask anything about your PDF' : 'Welcome to PDFGeek'}
                </h2>
                <p style={{ color: 'var(--muted)' }}>
                  {file
                    ? 'Type a question or pick a quick action below.'
                    : 'Upload a PDF on the left to get started.'}
                </p>
                {file && (
                  <div className="quick-action-chips">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action}
                        className="quick-action-chip"
                        onClick={() => sendQuestion(action)}
                        disabled={loading}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`message-row ${msg.role}`}>
                <div className={`message-bubble ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="message-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipLoader size={16} color="var(--primary)" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <form className="prompt-input" onSubmit={handleSubmit}>
            <textarea
              rows={1}
              placeholder={file ? 'Ask a question about your PDF...' : 'Upload a PDF first'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!file || loading}
            />
            <button type="submit" disabled={!file || !inputText.trim() || loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
