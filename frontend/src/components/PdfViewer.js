import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Box, IconButton, Tooltip, Divider, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
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
  const containerRef = useRef(null);
  const pageWrapperRef = useRef(null);

  const { addHighlight, addComment, setNotePanelOpen } = useAnnotations();

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
                <Typography variant="body2" sx={{ opacity: 0.85, mx: 0.5 }}>
                  Page {pageNum} of {numPages}
                </Typography>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Previous page" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setPageNum(p => Math.max(p - 1, 1))}
                        disabled={pageNum <= 1}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Next page" arrow>
                    <span>
                      <IconButton
                        size="small"
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
                    <IconButton size="small" onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}>
                      <ZoomOutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="body2" sx={{ opacity: 0.85, mx: 0.5, minWidth: 36, textAlign: 'center' }}>
                    {Math.round(scale * 100)}%
                  </Typography>
                  <Tooltip title="Zoom in" arrow>
                    <IconButton size="small" onClick={() => setScale(s => Math.min(s + 0.2, 3))}>
                      <ZoomInIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Rotate left" arrow>
                    <IconButton size="small" onClick={() => setRotation(r => (r - 90 + 360) % 360)}>
                      <RotateLeftIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rotate right" arrow>
                    <IconButton size="small" onClick={() => setRotation(r => (r + 90) % 360)}>
                      <RotateRightIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <Tooltip title="Notes" arrow>
                    <IconButton size="small" onClick={() => setNotePanelOpen(true)} sx={{ color: '#f59e0b' }}>
                      <StickyNote2Icon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                <div className="pdf-page-wrapper" ref={pageWrapperRef}>
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
