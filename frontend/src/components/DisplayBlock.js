import React from 'react';

function DisplayBlock({ title, content }) {
  return (
    <section className="text-block">
      <h2>{title}</h2>
      <pre>{content}</pre>
    </section>
  );
}

export default DisplayBlock;
