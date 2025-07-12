import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [extractedText, setExtractedText] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(res.data.message || 'File uploaded!');
      setExtractedText(res.data.text || '');

    } catch (err) {
      console.error(err);
      setMessage('Upload failed.');
    }
  };

  return (
    <div className="App">
      <h1>AI PDF Chatbot</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload PDF</button>
      <p>{message}</p>

      {extractedText && (
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '2rem auto', whiteSpace: 'pre-wrap' }}>
          <h2>Extracted Text:</h2>
          <p>{extractedText}</p>
        </div>
      )}
    </div>
  );
}

export default App;
