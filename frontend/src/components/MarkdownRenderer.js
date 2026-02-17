import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Lazy-loaded Markdown renderer with syntax highlighting and math support.
 * Code-split to reduce main bundle size by ~150KB.
 */
function MarkdownRenderer({ content, components }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
