import React from 'react';
import PdfViewer from './PdfViewer';
import ImageViewer from './ImageViewer';
import TextViewer from './TextViewer';

export default function FileViewer({ file, fileType, targetPage, onPageChange }) {
  if (!file) return null;

  switch (fileType) {
    case 'pdf':
      return <PdfViewer file={file} targetPage={targetPage} onPageChange={onPageChange} />;
    case 'image':
      return <ImageViewer file={file} />;
    case 'txt':
    case 'docx':
      return <TextViewer file={file} fileType={fileType} />;
    default:
      return <TextViewer file={file} fileType={fileType} />;
  }
}
