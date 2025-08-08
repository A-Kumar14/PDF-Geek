import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function PdfViewer({ file, darkMode }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const miniBtnStyle = {
    fontSize: '0.75rem',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    cursor: 'pointer',
    backgroundColor: darkMode ? '#444' : '#f9f9f9',
    color: darkMode ? '#fff' : '#000',
    transition: 'all 0.2s ease-in-out'
  };

  useEffect(() => {
    const loadPdf = async () => {
      if (!file) {
        setPdfDoc(null);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target.result);
        try {
          const loadingTask = pdfjsLib.getDocument(typedarray);
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setPageNum(1);
        } catch (err) {
          console.error("Error loading PDF", err);
        }
      };
      fileReader.readAsArrayBuffer(file);
    };
    loadPdf();
  }, [file]);

  useEffect(() => {
    const renderPage = async (pageNumber) => {
      if (!pdfDoc) return;

      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale, rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          console.warn("Render cancel error suppressed:", e.message);
        }
      }

      const renderContext = { canvasContext: context, viewport };
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn("Suppressed rendering error:", err.message);
        }
      }
    };

    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum, scale, rotation]);

  return (
    <div className="pdf-viewer">
      {pdfDoc && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.8rem'
        }}>
          <button style={miniBtnStyle} onClick={() => setPageNum(p => Math.max(p - 1, 1))} disabled={pageNum <= 1}>⬅ Prev</button>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Page {pageNum} of {totalPages}</span>
          <button style={miniBtnStyle} onClick={() => setPageNum(p => Math.min(p + 1, totalPages))} disabled={pageNum >= totalPages}>Next ➡</button>

          <button style={miniBtnStyle} onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}>➖ Zoom</button>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{Math.round(scale * 100)}%</span>
          <button style={miniBtnStyle} onClick={() => setScale(s => Math.min(s + 0.2, 3))}>➕ Zoom</button>

          <button style={miniBtnStyle} onClick={() => setRotation(r => (r - 90 + 360) % 360)}>⤴ Rot L</button>
          <button style={miniBtnStyle} onClick={() => setRotation(r => (r + 90) % 360)}>⤵ Rot R</button>
        </div>
      )}

      <div className="pdf-container">
        {pdfDoc ? (
          <canvas ref={canvasRef} />
        ) : (
          <div className="placeholder">Upload a PDF to preview</div>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
