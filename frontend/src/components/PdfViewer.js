import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Box, Tooltip, Typography, TextField } from '@mui/material';
import './PdfViewer.css';
import HighlightLayer from './HighlightLayer';
import SelectionToolbar from './SelectionToolbar';
import StickyNotePanel from './StickyNotePanel';
import { useAnnotations } from '../contexts/AnnotationContext';
import { useFile } from '../contexts/FileContext';
import { getSelectionRectsRelativeTo } from '../utils/selectionUtils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* ── Lazy thumbnail with IntersectionObserver ── */
const LazyThumbnail = React.memo(
  function LazyThumbnail({ pageNumber, isActive, onClick }) {
    const ref = useRef(null);
    const [hasRendered, setHasRendered] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHasRendered(true);
            observer.disconnect();
          }
        },
        { rootMargin: '100px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    // Auto-scroll active thumbnail into view
    useEffect(() => {
      if (isActive && ref.current) {
        ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, [isActive]);

    return (
      <button
        ref={ref}
        type="button"
        className={`pdf-thumb ${isActive ? 'active' : ''}`}
        onClick={onClick}
        aria-label={`Go to page ${pageNumber}`}
      >
        {hasRendered ? (
          <Page
            pageNumber={pageNumber}
            width={150}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ) : (
          <span className="pdf-thumb-placeholder">{pageNumber}</span>
        )}
        <span className="pdf-thumb-num">{pageNumber}</span>
      </button>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if pageNumber or isActive changes
    return prevProps.pageNumber === nextProps.pageNumber && prevProps.isActive === nextProps.isActive;
  }
);

/* ── Text-based toolbar button ── */
function ToolBtn({ label, onClick, disabled, active, tooltip }) {
  const btn = (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? '#555' : active ? '#00FF00' : '#888',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        fontWeight: 700,
        px: 0.5,
        userSelect: 'none',
        '&:hover': disabled ? {} : { color: '#E5E5E5' },
      }}
    >
      {label}
    </Box>
  );
  return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn;
}

/* ── Vertical separator ── */
function Sep() {
  return <Box sx={{ width: '1px', height: 20, bgcolor: '#333333', mx: 0.25 }} />;
}

function PdfViewer({ file, targetPage, onPageChange }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [darkFilter, setDarkFilter] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const containerRef = useRef(null);
  const pageWrapperRef = useRef(null);

  const { addHighlight, addComment, setNotePanelOpen, highlights, notes, comments } = useAnnotations();
  const { activeSourceHighlight } = useFile();
  const [computedSourceRects, setComputedSourceRects] = useState([]);

  const handleExportAnnotations = useCallback(() => {
    const data = { highlights, notes, comments, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${file?.name || 'document'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [highlights, notes, comments, file]);

  const fileData = useMemo(() => {
    if (!file) return null;
    return file;
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setPageNum(1);
    setRotation(0);
  }, []);

  useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= numPages) {
      setPageNum(targetPage);
    }
  }, [targetPage, numPages]);

  useEffect(() => {
    if (onPageChange) onPageChange(pageNum, numPages);
  }, [pageNum, numPages, onPageChange]);

  const findTextRectsForExcerpt = useCallback((excerptText) => {
    const textLayer = pageWrapperRef.current?.querySelector('.react-pdf__Page__textContent');
    if (!textLayer || !excerptText) return [];
    const words = excerptText.trim().split(/\s+/).slice(0, 8);
    const containerRect = pageWrapperRef.current.getBoundingClientRect();
    return Array.from(textLayer.querySelectorAll('span'))
      .filter((span) => words.some((w) => span.textContent?.includes(w)))
      .map((span) => {
        const r = span.getBoundingClientRect();
        return {
          x: (r.left - containerRect.left) / scale,
          y: (r.top - containerRect.top) / scale,
          width: r.width / scale,
          height: r.height / scale,
        };
      });
  }, [scale]);

  // Compute source highlight rects when activeSourceHighlight changes
  useEffect(() => {
    if (!activeSourceHighlight || activeSourceHighlight.page !== pageNum) {
      setComputedSourceRects([]);
      return;
    }
    const timer = setTimeout(() => {
      const rects = findTextRectsForExcerpt(activeSourceHighlight.excerpt);
      setComputedSourceRects(rects.length > 0 ? [{ page: pageNum, rects }] : []);
      if (rects[0] && pageWrapperRef.current?.parentElement) {
        pageWrapperRef.current.parentElement.scrollTo({
          top: rects[0].y * scale - 80,
          behavior: 'smooth',
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSourceHighlight, pageNum, scale, findTextRectsForExcerpt]);

  const handleHighlight = useCallback(() => {
    if (!pageWrapperRef.current) return;
    const result = getSelectionRectsRelativeTo(pageWrapperRef.current, scale);
    if (!result) return;
    addHighlight({
      text: result.text,
      color: 'rgba(255, 235, 59, 0.4)',
      rects: result.rects,
      pageNum,
    });
  }, [scale, pageNum, addHighlight]);

  const handleComment = useCallback((commentText) => {
    if (!pageWrapperRef.current) return;
    const result = getSelectionRectsRelativeTo(pageWrapperRef.current, scale);
    if (!result) return;
    addComment({
      text: result.text,
      comment: commentText,
      rects: result.rects,
      pageNum,
    });
  }, [scale, pageNum, addComment]);

  const hasAnnotations = highlights.length > 0 || notes.length > 0 || comments.length > 0;

  if (!fileData) {
    return <div className="placeholder">[ NO_DOCUMENT ]</div>;
  }

  return (
    <div className="pdf-viewer-wrap" ref={containerRef}>
      <Document
        file={fileData}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', color: '#888' }}>[ LOADING... ]</Typography>
          </Box>
        }
        error={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography sx={{ fontFamily: 'monospace', color: '#FF0000' }}>ERROR: FAILED_TO_LOAD_PDF</Typography>
          </Box>
        }
      >
        {numPages > 0 && (
          <>
            {/* ── Toolbar ── */}
            <header className="pdf-viewer-sticky-header">
              <Box className="pdf-toolbar">
                {/* Page navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ToolBtn
                    label="[<]"
                    onClick={() => setPageNum((p) => Math.max(p - 1, 1))}
                    disabled={pageNum <= 1}
                    tooltip="Previous page"
                  />
                  <TextField
                    size="small"
                    value={pageInput || pageNum}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(pageInput, 10);
                      if (val >= 1 && val <= numPages) setPageNum(val);
                      setPageInput('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput, 10);
                        if (val >= 1 && val <= numPages) setPageNum(val);
                        setPageInput('');
                        e.target.blur();
                      }
                    }}
                    onFocus={() => setPageInput(String(pageNum))}
                    slotProps={{
                      input: {
                        sx: {
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          py: 0.25,
                          px: 0.5,
                        },
                      },
                    }}
                    sx={{ width: 44 }}
                    aria-label="Go to page"
                  />
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                    / {numPages}
                  </Typography>
                  <ToolBtn
                    label="[>]"
                    onClick={() => setPageNum((p) => Math.min(p + 1, numPages))}
                    disabled={pageNum >= numPages}
                    tooltip="Next page"
                  />
                </Box>

                <Sep />

                {/* Zoom */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ToolBtn
                    label="[-]"
                    onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
                    disabled={scale <= 0.5}
                    tooltip="Zoom out"
                  />
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#E5E5E5', minWidth: 36, textAlign: 'center' }}>
                    {Math.round(scale * 100)}%
                  </Typography>
                  <ToolBtn
                    label="[+]"
                    onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
                    disabled={scale >= 3}
                    tooltip="Zoom in"
                  />
                </Box>

                <Sep />

                {/* Rotate */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <ToolBtn label="[<R]" onClick={() => setRotation((r) => (r - 90 + 360) % 360)} tooltip="Rotate left" />
                  <ToolBtn label="[R>]" onClick={() => setRotation((r) => (r + 90) % 360)} tooltip="Rotate right" />
                </Box>

                <Sep />

                {/* Tools */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <ToolBtn label="[NOTES]" onClick={() => setNotePanelOpen(true)} tooltip="Open notes" />
                  <ToolBtn
                    label="[INV]"
                    onClick={() => setDarkFilter((d) => !d)}
                    active={darkFilter}
                    tooltip={darkFilter ? 'Normal view' : 'Dark reading mode'}
                  />
                  {hasAnnotations && (
                    <ToolBtn label="[EXP]" onClick={handleExportAnnotations} tooltip="Export annotations" />
                  )}
                </Box>
              </Box>
            </header>

            <div className="pdf-viewer-body">
              {/* ── Thumbnail sidebar ── */}
              <aside className="pdf-thumbnails">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                  <LazyThumbnail
                    key={n}
                    pageNumber={n}
                    isActive={pageNum === n}
                    onClick={() => setPageNum(n)}
                  />
                ))}
              </aside>

              {/* ── Main page view ── */}
              <div className="pdf-container">
                <div
                  className="pdf-page-wrapper"
                  ref={pageWrapperRef}
                  style={darkFilter ? { filter: 'invert(0.88) hue-rotate(180deg)' } : undefined}
                >
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    devicePixelRatio={window.devicePixelRatio || 1}
                  />
                  <HighlightLayer pageNum={pageNum} scale={scale} sourceHighlights={computedSourceRects} />
                </div>
              </div>
            </div>

            <SelectionToolbar
              containerRef={pageWrapperRef}
              onHighlight={handleHighlight}
              onComment={handleComment}
              onOpenNotes={() => setNotePanelOpen(true)}
            />
            <StickyNotePanel />
          </>
        )}
      </Document>
    </div>
  );
}

export default PdfViewer;
