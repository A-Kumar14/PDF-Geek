import React, { useState } from 'react';
import './App.css';
import './components/MarkdownResponse';
import PdfViewer from './components/PdfViewer';
import FileUpload from './components/FileUpload';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RotateLoader } from 'react-spinners';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('Give a detailed summary of the document.');
  const [status, setStatus] = useState('');
  const [answer, setAnswer] = useState('');
  const [showLatex, setShowLatex] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setloading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', question);
    formData.append('chat_history', JSON.stringify(chatHistory));

    setStatus('Uploading & processing...');
    setAnswer('');
    setShowLatex(false);
    setloading(true);

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setStatus(data.message || 'Done');
      setAnswer(data.answer || '');
      setShowLatex(true);

      setChatHistory(prev => [...prev, { question, answer: data.answer }]);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
    } finally {
      setloading(false);
    }
  };

  const handleFileClick = (e) => {
    if (e.target === e.currentTarget || e.target.tagName === 'P') {
      document.getElementById('hiddenFileInput').click();
    }
  };

  const downloadChatHistory = () => {
    if (chatHistory.length === 0) return;

    const content = chatHistory.map((entry, idx) =>
      `Q${idx + 1}: ${entry.question}\nA${idx + 1}: ${entry.answer}\n\n`
    ).join('');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat_history.txt';
    link.click();
    URL.revokeObjectURL(url);
  };


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
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <div style = {{position : 'absolute' , top : '1rem' , right : '1rem'}}>
        <button
          onClick={() => setDarkMode(prev => !prev)}
          style = {{
            padding : '0.4rem 0.8rem',
            borderRadius : '5px',
            border: 'none',
            backgroundColor : darkMode ? '#f0f0f0' : '#333',
            cursor : 'pointer',
            fontweight : 'bold'
          }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      <h1>PDFGeek</h1>
      <div className="main-container" style={{ display: 'flex', flexDirection: 'row', gap: '2rem', padding: '1rem' }}>
        <div
          className="left-panel"
          style={{
            flex: 1,
            border: '2px dashed #ccc',
            padding: '1rem',
            cursor: file ? 'default' : 'pointer',
            height: '100%',
            overflow: 'auto',
            position: 'relative'
          }}
          onClick={handleFileClick}
        >
          <input
            type="file"
            id="hiddenFileInput"
            style={{ display: 'none' }}
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          {file ? (
            <>
              <PdfViewer file={file} key={file?.name} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setAnswer('');
                  setStatus('');
                  setShowLatex(false);
                  setChatHistory([]);
                  setShowHistory(false);
                }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.9rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Change File
              </button>
            </>
          ) : (
            <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer' }}>
              Click here to upload a PDF
            </p>
          )}
        </div>

        <div className="right-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <FileUpload
            file={file}
            setFile={setFile}
            question={question}
            setQuestion={setQuestion}
            handleUpload={handleUpload}
            status={status}
            answer={answer}
            showLatex={showLatex}
            hideFileButton={true}
            loading={loading}
          />

          {loading && (
            <div style={{ marginTop : '0.5rem' }}>
              <RotateLoader size={40} color="rgba(26, 40, 235, 1)" />
            </div>
          )}

          {chatHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(prev => !prev)}
              style={{ marginTop: '1rem', padding: '0.5rem', alignSelf: 'start' }}
            >
              {showHistory ? 'Hide Chat History' : 'Show Chat History'}
            </button>
          )}

          {chatHistory.length > 0 && (
            <button
              onClick = {downloadChatHistory}
              style = {{
                marginTop : '0.5rem',
                padding : '0.5rem',
                alignSelf : 'start',
                backgroundColor : '#4CAF50',
                color : 'white',
                border: 'none',
                borderRadius : '5px',
                cursor : 'pointer'
              }}
            >
              Download Chat History
            </button>
          )}

          {showHistory && chatHistory.length > 0 && (
            <div className="chat-history" style={{ marginTop: '1rem', overflowY: 'auto', maxHeight: '300px' }}>
              <h3>Chat History</h3>
              {chatHistory.map((item, idx) => (
                <div key={idx} className="chat-entry">
                  <p><strong>Q:</strong> {item.question}</p>
                  <p><strong>A:</strong></p>
                  <MarkdownResponse markdown={item.answer} />
                  <hr />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
