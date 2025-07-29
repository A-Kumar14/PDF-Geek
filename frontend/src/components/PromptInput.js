import React from 'react';

function PromptInput({ question, setQuestion }) {
  return (
    <div className="form-row">
      <label htmlFor="question">Question / Prompt:</label>
      <textarea
        id="question"
        rows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
    </div>
  );
}

export default PromptInput;
