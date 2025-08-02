import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function PdfViewer({ file }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // Track current render task

  // Load PDF whenever file changes
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

  // Render page when dependencies change
  useEffect(() => {
    const renderPage = async (pageNumber) => {
      if (!pdfDoc) return;

      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale, rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Cancel previous render task if any
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
        <div className="controls-container">
          <div className="page-controls">
            <button onClick={() => setPageNum(p => Math.max(p - 1, 1))} disabled={pageNum <= 1}>
              Previous
            </button>
            <span>Page {pageNum} of {totalPages}</span>
            <button onClick={() => setPageNum(p => Math.min(p + 1, totalPages))} disabled={pageNum >= totalPages}>
              Next
            </button>
          </div>

          <div className="zoom-controls">
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}>Zoom Out</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.2, 3))}>Zoom In</button>
          </div>

          <div className="rotation-controls">
            <button onClick={() => setRotation(r => (r - 90 + 360) % 360)}>Rotate Left</button>
            <button onClick={() => setRotation(r => (r + 90) % 360)}>Rotate Right</button>
          </div>
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
