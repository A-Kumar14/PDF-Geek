import React from 'react';
import ReactMarkdown from 'react-markdown';

function MarkdownResponse({ markdown }) {
  if (!markdown) return null;

  return (
    <section className="text-block">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </section>
  );
}

export default MarkdownResponse;
