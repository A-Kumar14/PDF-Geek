import React from 'react';
import MarkdownResponse from './MarkdownResponse';

function FileUpload({ 
  file, 
  setFile, 
  question, 
  setQuestion, 
  handleUpload, 
  status, 
  answer, 
  showLatex, 
  hideFileButton 
}) {
  return (
    <div>
      {!hideFileButton && (
        <div className="form-row">
          <label>Upload PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
      )}

      <div className="form-row">
        <label>Ask:</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question about the document..."
        />
      </div>

      <button onClick={handleUpload}>
        Ask
      </button>

      {showLatex && answer && (
        <div className="text-block">
          <MarkdownResponse markdown = {answer}/>
        </div>
      )}
    </div>
  );
}

export default FileUpload;