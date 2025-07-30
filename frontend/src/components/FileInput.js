import React from 'react';

function FileInput({ setFile }) {
  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="form-row">
      <input type="file" accept="application/pdf" onChange={handleChange} />
    </div>
  );
}

export default FileInput;