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
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const isScrollingTo = useRef(false);

  // Backward-compat: single active page wrapper for selection/annotation tools
  const pageWrapperRef = { current: pageRefs.current[pageNum - 1] || null };

  const { addHighlight, addComment, setNotePanelOpen, highlights, notes, comments, undo, redo } = useAnnotations();
  const { activeSourceHighlight } = useFile();
  const [computedSourceRects, setComputedSourceRects] = useState([]);

  // Cmd+Z / Cmd+Shift+Z — undo/redo annotations
  useEffect(() => {
    const handleKey = (e) => {
      // Ignore when typing in an input or textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrl || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

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
    pageRefs.current = [];
  }, []);

  // Scroll to a page programmatically (from toolbar or thumbnail)
  const scrollToPage = useCallback((n) => {
    const el = pageRefs.current[n - 1];
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    isScrollingTo.current = true;
    // Use direct scrollTop assignment — reliable even when scrollIntoView
    // would scroll the wrong ancestor (e.g. the browser viewport).
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    container.scrollBy({ top: elTop - containerTop - 8, behavior: 'smooth' });
    setTimeout(() => { isScrollingTo.current = false; }, 800);
  }, []);

  // Update pageNum from IntersectionObserver as user scrolls
  useEffect(() => {
    if (numPages === 0 || !scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        let best = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = entry.target;
          }
        }
        if (best) {
          const n = parseInt(best.dataset.page, 10);
          if (!isNaN(n)) setPageNum(n);
        }
      },
      { root: scrollContainerRef.current, threshold: [0.3, 0.5, 0.8] }
    );
    pageRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [numPages]);

  useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= numPages) {
      setPageNum(targetPage);
      scrollToPage(targetPage);
    }
  }, [targetPage, numPages, scrollToPage]);

  useEffect(() => {
    if (onPageChange) onPageChange(pageNum, numPages);
  }, [pageNum, numPages, onPageChange]);

  // Navigate via toolbar buttons: set pageNum and scroll to it
  const goToPage = useCallback((n) => {
    const clamped = Math.max(1, Math.min(n, numPages));
    setPageNum(clamped);
    scrollToPage(clamped);
  }, [numPages, scrollToPage]);

  const findTextRectsForExcerpt = useCallback((excerptText, targetPageNum) => {
    const wrapper = pageRefs.current[(targetPageNum || pageNum) - 1];
    const textLayer = wrapper?.querySelector('.react-pdf__Page__textContent');
    if (!textLayer || !excerptText) return [];
    const words = excerptText.trim().split(/\s+/).slice(0, 8);
    const containerRect = wrapper.getBoundingClientRect();
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
  }, [scale, pageNum]);

  // Compute source highlight rects when activeSourceHighlight changes
  useEffect(() => {
    if (!activeSourceHighlight) {
      setComputedSourceRects([]);
      return;
    }
    const targetP = activeSourceHighlight.page || pageNum;
    setPageNum(targetP);
    scrollToPage(targetP);
    const timer = setTimeout(() => {
      const rects = findTextRectsForExcerpt(activeSourceHighlight.excerpt, targetP);
      setComputedSourceRects(rects.length > 0 ? [{ page: targetP, rects }] : []);
      if (rects[0]) {
        const wrapper = pageRefs.current[targetP - 1];
        wrapper?.parentElement?.scrollTo({
          top: wrapper.offsetTop + rects[0].y * scale - 80,
          behavior: 'smooth',
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [activeSourceHighlight, scrollToPage, findTextRectsForExcerpt, pageNum, scale]);

  const handleHighlight = useCallback(() => {
    const wrapper = pageRefs.current[pageNum - 1];
    if (!wrapper) return;
    const result = getSelectionRectsRelativeTo(wrapper, scale);
    if (!result) return;
    addHighlight({
      text: result.text,
      color: 'rgba(255, 235, 59, 0.4)',
      rects: result.rects,
      pageNum,
    });
  }, [scale, pageNum, addHighlight]);

  const handleComment = useCallback((commentText) => {
    const wrapper = pageRefs.current[pageNum - 1];
    if (!wrapper) return;
    const result = getSelectionRectsRelativeTo(wrapper, scale);
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
        className="pdf-document"
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
                    onClick={() => goToPage(pageNum - 1)}
                    disabled={pageNum <= 1}
                    tooltip="Previous page"
                  />
                  <TextField
                    size="small"
                    value={pageInput || pageNum}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(pageInput, 10);
                      if (val >= 1 && val <= numPages) goToPage(val);
                      setPageInput('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput, 10);
                        if (val >= 1 && val <= numPages) goToPage(val);
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
                    onClick={() => goToPage(pageNum + 1)}
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
                    onClick={() => goToPage(n)}
                  />
                ))}
              </aside>

              {/* ── Main page view (all pages scrollable) ── */}
              <div className="pdf-container" ref={scrollContainerRef}>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className="pdf-page-wrapper"
                    data-page={n}
                    ref={(el) => { pageRefs.current[n - 1] = el; }}
                    style={darkFilter ? { filter: 'invert(0.88) hue-rotate(180deg)' } : undefined}
                  >
                    <Page
                      pageNumber={n}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      devicePixelRatio={window.devicePixelRatio || 1}
                    />
                    <HighlightLayer
                      pageNum={n}
                      scale={scale}
                      sourceHighlights={computedSourceRects}
                    />
                  </div>
                ))}
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
