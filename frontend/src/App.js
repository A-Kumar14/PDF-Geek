import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('Give a detailed summary of the document.');
  const [status, setStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [answer, setAnswer] = useState('');
  const [showLatex, setShowLatex] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleQuestionChange = (e) => setQuestion(e.target.value);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question', question);

    setStatus('Uploading & processing...');
    setExtractedText(''); setAnswer('');

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      setStatus(res.data.message || 'Done');
      setExtractedText(res.data.text || '');
      setAnswer(res.data.answer || '');
      setShowLatex(true);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
      setShowLatex(false);
    }
  };

  return (
    <div className="App">
      <h1>AI PDF Chatbot</h1>
      <div className="form-row">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
      </div>
      <div className="form-row">
        <label htmlFor="question">Question / Prompt:</label>
        <textarea
          id="question"
          rows={2}
          value={question}
          onChange={handleQuestionChange}
        />
      </div>
      <button onClick={handleUpload}>Upload & Ask</button>
      <p className="status">{status}</p>

      {extractedText && (
        <section className="text-block">
          <h2>Extracted Text</h2>
          <pre>{extractedText}</pre>
        </section>
      )}

      {showLatex && answer && (
        <section className="text-block">
          <h2>AI Response</h2>
          <pre className="latex-block">{answer}</pre>
        </section>
      )}
    </div>
  );
}

export default App;