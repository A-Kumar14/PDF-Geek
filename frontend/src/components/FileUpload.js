import React, { useState } from 'react';
import axios from 'axios';
import PromptInput from './PromptInput';
import FileInput from './FileInput';
import DisplayBlock from './DisplayBlock';
import MarkdownResponse from './MarkdownResponse';
import PdfViewer from './PdfViewer';
import './FileUpload.css';

function FileUpload() {
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
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus(res.data.message || 'Done');
      setAnswer(res.data.answer || '');
      setShowLatex(true);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
    }
  };

  return (
    <div className="upload-container">
      <FileInput setFile={setFile} />
      <PromptInput question={question} setQuestion={setQuestion} />
      <button onClick={handleUpload}>Upload & Ask</button>
      <p className="status">{status}</p>

      <div className="side-by-side">
        <div className="left-panel">
          <PdfViewer file={file} />
        </div>
        <div className="right-panel">
          {showLatex && answer && <MarkdownResponse markdown={answer} />}
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
