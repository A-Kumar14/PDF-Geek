import React from 'react';

function FileUpload({
  file,
  setFile,
  question,
  setQuestion,
  handleUpload,
  hideFileButton,
  loading
}) {
  return (
    <div style={{ marginTop: '1rem' }}>
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
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about the document..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: '5px',
            resize: 'vertical',
            fontSize: '1rem'
          }}
        />
      </div>

      <button
        onClick={handleUpload}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        disabled={loading}
      >
        {loading ? 'Asking...' : 'Ask'}
      </button>
    </div>
  );
}

export default FileUpload;
