import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Box, IconButton, Tooltip, Divider, Typography, TextField } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import './PdfViewer.css';
import HighlightLayer from './HighlightLayer';
import SelectionToolbar from './SelectionToolbar';
import StickyNotePanel from './StickyNotePanel';
import { useAnnotations } from '../contexts/AnnotationContext';
import { getSelectionRectsRelativeTo } from '../utils/selectionUtils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

  // Convert File object to ArrayBuffer for react-pdf
  const fileData = useMemo(() => {
    if (!file) return null;
    return file;
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    setPageNum(1);
    setRotation(0);
  }, []);

  // Navigate to target page
  useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= numPages) {
      setPageNum(targetPage);
    }
  }, [targetPage, numPages]);

  // Report page changes
  useEffect(() => {
    if (onPageChange) onPageChange(pageNum, numPages);
  }, [pageNum, numPages, onPageChange]);

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

  if (!fileData) {
    return <div className="placeholder">Upload a PDF to preview</div>;
  }

  return (
    <div className="pdf-viewer-wrap" ref={containerRef}>
      <Document
        file={fileData}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography color="text.secondary">Loading PDF...</Typography>
          </Box>
        }
        error={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography color="error">Failed to load PDF</Typography>
          </Box>
        }
      >
        {numPages > 0 && (
          <>
            <header className="pdf-viewer-sticky-header">
              <Box className="pdf-toolbar" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.75rem', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Previous page" arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Previous page"
                        onClick={() => setPageNum(p => Math.max(p - 1, 1))}
                        disabled={pageNum <= 1}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
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
                    slotProps={{ input: { sx: { textAlign: 'center', fontSize: '0.8rem', py: 0.25, px: 0.5 } } }}
                    sx={{ width: 44, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    aria-label="Go to page"
                  />
                  <Typography variant="body2" sx={{ opacity: 0.85, whiteSpace: 'nowrap' }}>
                    / {numPages}
                  </Typography>
                  <Tooltip title="Next page" arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Next page"
                        onClick={() => setPageNum(p => Math.min(p + 1, numPages))}
                        disabled={pageNum >= numPages}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Zoom out" arrow>
                    <IconButton size="small" aria-label="Zoom out" onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}>
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="body2" sx={{ opacity: 0.85, mx: 0.5, minWidth: 36, textAlign: 'center' }}>
                    {Math.round(scale * 100)}%
                  </Typography>
                  <Tooltip title="Zoom in" arrow>
                    <IconButton size="small" aria-label="Zoom in" onClick={() => setScale(s => Math.min(s + 0.2, 3))}>
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Rotate left" arrow>
                    <IconButton size="small" aria-label="Rotate left" onClick={() => setRotation(r => (r - 90 + 360) % 360)}>
                      <RotateLeftIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rotate right" arrow>
                    <IconButton size="small" aria-label="Rotate right" onClick={() => setRotation(r => (r + 90) % 360)}>
                      <RotateRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Notes" arrow>
                    <IconButton size="small" aria-label="Open notes panel" onClick={() => setNotePanelOpen(true)} sx={{ color: '#f59e0b' }}>
                      <StickyNote2Icon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={darkFilter ? 'Normal view' : 'Dark reading mode'} arrow>
                    <IconButton
                      size="small"
                      aria-label="Toggle dark reading filter"
                      onClick={() => setDarkFilter((d) => !d)}
                      sx={{ color: darkFilter ? 'primary.main' : 'text.secondary' }}
                    >
                      <InvertColorsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {(highlights.length > 0 || notes.length > 0 || comments.length > 0) && (
                    <Tooltip title="Export annotations" arrow>
                      <IconButton size="small" aria-label="Export annotations" onClick={handleExportAnnotations}>
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </header>

            <div className="pdf-viewer-body">
              {/* Thumbnail sidebar */}
              <aside className="pdf-thumbnails">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`pdf-thumb ${pageNum === n ? 'active' : ''}`}
                    onClick={() => setPageNum(n)}
                    aria-label={`Go to page ${n}`}
                  >
                    <Page
                      pageNumber={n}
                      scale={0.15}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <span className="pdf-thumb-num">{n}</span>
                  </button>
                ))}
              </aside>

              {/* Main page view */}
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
                  <HighlightLayer pageNum={pageNum} scale={scale} />
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
