import React from 'react';
import ReactMarkdown from 'react-markdown';

function MarkdownResponse({ markdown }) {
  if (!markdown) return null;

  return (
    <section className="text-block">
      <h2>AI Response</h2>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </section>
  );
}

export default MarkdownResponse;
