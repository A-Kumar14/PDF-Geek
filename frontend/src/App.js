import React, { useState } from 'react';
import './App.css';
import PdfViewer from './components/PdfViewer';
import FileUpload from './components/FileUpload';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('Give a detailed summary of the document.');
  const [status, setStatus] = useState('');
  const [answer, setAnswer] = useState('');
  const [showLatex, setShowLatex] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', question);

    setStatus('Uploading & processing...');
    setAnswer('');
    setShowLatex(false);

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setStatus(data.message || 'Done');
      setAnswer(data.answer || '');
      setShowLatex(true);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
    }
  };

  const handleFileClick = (e) => {
    // Only trigger file input if clicking on the container itself or the placeholder text
    if (e.target === e.currentTarget || e.target.tagName === 'P') {
      document.getElementById('hiddenFileInput').click();
    }
  };

  return (
    <div className="App">
      <h1>PDFGeek</h1>
      <div className="main-container" style={{ display: 'flex', flexDirection: 'row', gap: '2rem', padding: '1rem' }}>
        {/* Left Panel: Clickable PDF Upload + Viewer */}
        <div
          className="left-panel"
          style={{ 
            flex: 1, 
            border: '2px dashed #ccc', 
            padding: '1rem', 
            cursor: file ? 'default' : 'pointer' 
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
          <PdfViewer file={file} />
          {!file && <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer' }}>Click here to upload a PDF</p>}
        </div>

        {/* Right Panel: Prompt input + Result */}
        <div className="right-panel" style={{ flex: 1 }}>
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
          />
        </div>
      </div>
    </div>
  );
}

export default App;