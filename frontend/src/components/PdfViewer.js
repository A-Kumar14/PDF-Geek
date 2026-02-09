import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

<<<<<<< HEAD
const THUMB_SCALE = 0.15;

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
function PdfViewer({ file, darkMode }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
<<<<<<< HEAD
  const [thumbnails, setThumbnails] = useState([]);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const containerRef = useRef(null);
=======
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
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f

  useEffect(() => {
    const loadPdf = async () => {
      if (!file) {
        setPdfDoc(null);
<<<<<<< HEAD
        setThumbnails([]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
=======
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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
<<<<<<< HEAD
          setRotation(0);
          setThumbnails([]);
=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
        } catch (err) {
          console.error("Error loading PDF", err);
        }
      };
      fileReader.readAsArrayBuffer(file);
    };
    loadPdf();
  }, [file]);

<<<<<<< HEAD
  // Load thumbnails when pdfDoc is ready
  useEffect(() => {
    if (!pdfDoc || pdfDoc.numPages === 0) return;
    const loadThumbs = async () => {
      const thumbs = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: THUMB_SCALE, rotation: 0 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL() });
        } catch (e) {
          thumbs.push({ pageNum: i, dataUrl: null });
        }
      }
      setThumbnails(thumbs);
    };
    loadThumbs();
  }, [pdfDoc]);

=======
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
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
<<<<<<< HEAD
    <div className="pdf-viewer-wrap" ref={containerRef}>
      {pdfDoc && (
        <>
          <header className="pdf-viewer-sticky-header">
            <div className="pdf-toolbar">
              <span className="pdf-page-info">Page {pageNum} of {totalPages}</span>
              <div className="pdf-toolbar-group">
                <button
                  type="button"
                  className="pdf-toolbar-btn"
                  onClick={() => setPageNum(p => Math.max(p - 1, 1))}
                  disabled={pageNum <= 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  className="pdf-toolbar-btn"
                  onClick={() => setPageNum(p => Math.min(p + 1, totalPages))}
                  disabled={pageNum >= totalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
              <div className="pdf-toolbar-group">
                <button type="button" className="pdf-toolbar-btn" onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}>− Zoom</button>
                <span className="pdf-toolbar-label">{Math.round(scale * 100)}%</span>
                <button type="button" className="pdf-toolbar-btn" onClick={() => setScale(s => Math.min(s + 0.2, 3))}>+ Zoom</button>
              </div>
              <div className="pdf-toolbar-group">
                <button type="button" className="pdf-toolbar-btn" onClick={() => setRotation(r => (r - 90 + 360) % 360)}>↺ L</button>
                <button type="button" className="pdf-toolbar-btn" onClick={() => setRotation(r => (r + 90) % 360)}>↻ R</button>
              </div>
            </div>
          </header>

          <div className="pdf-viewer-body">
            <aside className="pdf-thumbnails">
              {thumbnails.map(({ pageNum: n, dataUrl }) => (
                <button
                  key={n}
                  type="button"
                  className={`pdf-thumb ${pageNum === n ? 'active' : ''}`}
                  onClick={() => setPageNum(n)}
                  aria-label={`Go to page ${n}`}
                >
                  {dataUrl ? (
                    <img src={dataUrl} alt={`Page ${n}`} />
                  ) : (
                    <span className="pdf-thumb-placeholder">{n}</span>
                  )}
                  <span className="pdf-thumb-num">{n}</span>
                </button>
              ))}
            </aside>
            <div className="pdf-container">
              {pdfDoc ? (
                <canvas ref={canvasRef} />
              ) : (
                <div className="placeholder">Upload a PDF to preview</div>
              )}
            </div>
          </div>
        </>
      )}
=======
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
>>>>>>> 0c32a561eab4198523fce77db149d6b5d0bd409f
    </div>
  );
}

export default PdfViewer;
