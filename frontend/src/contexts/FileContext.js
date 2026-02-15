import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { uploadFiles } from '../uploadthing';

const FileContext = createContext(null);

export function useFile() {
  return useContext(FileContext);
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
  'audio/ogg',
];

const MAX_FILES = 3;

function getFileType(entry) {
  const name = entry?.fileName || entry?.localFile?.name;
  if (!name) return null;
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext)) return 'audio';
  return 'unknown';
}

function createFileEntry(localFile) {
  return {
    localFile,
    uploadStatus: 'pending',
    uploadProgress: 0,
    uploadedUrl: null,
    uploadedKey: null,
    fileName: localFile.name,
    fileSize: localFile.size,
    fileType: localFile.type,
  };
}

export function FileProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [targetPage, setTargetPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Backward compat: `file` returns the raw File object for PdfViewer/ImageViewer/TextViewer
  const file = useMemo(() => {
    const entry = files[activeFileIndex];
    return entry?.localFile || null;
  }, [files, activeFileIndex]);

  const fileType = useMemo(() => {
    const entry = files[activeFileIndex];
    return getFileType(entry);
  }, [files, activeFileIndex]);

  const updateFileEntry = useCallback((index, updates) => {
    setFiles((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  }, []);

  const startUpload = useCallback(async (fileEntries, startIndex) => {
    const localFiles = fileEntries.map((e) => e.localFile);

    // Mark all as uploading
    fileEntries.forEach((_, i) => {
      updateFileEntry(startIndex + i, { uploadStatus: 'uploading', uploadProgress: 0 });
    });

    try {
      // Get JWT token for auth header
      const token = localStorage.getItem('filegeek-token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const results = await uploadFiles('documentUploader', {
        files: localFiles,
        headers,
        onUploadProgress: ({ file: progressFile, progress }) => {
          const idx = fileEntries.findIndex((e) => e.localFile.name === progressFile);
          if (idx !== -1) {
            updateFileEntry(startIndex + idx, { uploadProgress: progress });
          }
        },
      });

      results.forEach((result, i) => {
        updateFileEntry(startIndex + i, {
          uploadStatus: 'complete',
          uploadProgress: 100,
          uploadedUrl: result.url,
          uploadedKey: result.key,
        });
      });
    } catch (err) {
      console.error('Upload failed:', err);
      fileEntries.forEach((_, i) => {
        updateFileEntry(startIndex + i, { uploadStatus: 'error', uploadProgress: 0 });
      });
    }
  }, [updateFileEntry]);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExts = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'mp3', 'wav', 'm4a', 'webm', 'ogg'];
    if (!validExts.includes(ext) && !ACCEPTED_TYPES.includes(selectedFile.type)) return;

    const entry = createFileEntry(selectedFile);

    setFiles((prev) => {
      let newFiles;
      let insertIndex;
      if (prev.length >= MAX_FILES) {
        newFiles = [...prev];
        insertIndex = prev.length - 1;
        newFiles[insertIndex] = entry;
      } else {
        insertIndex = prev.length;
        newFiles = [...prev, entry];
      }
      // Trigger upload after state update
      setTimeout(() => startUpload([entry], insertIndex), 0);
      return newFiles;
    });

    setActiveFileIndex((prev) => {
      return files.length < MAX_FILES ? files.length : files.length - 1;
    });
    setTargetPage(null);
    setCurrentPage(1);
    setTotalPages(0);
  }, [files.length, startUpload]);

  const retryUpload = useCallback((index) => {
    const entry = files[index];
    if (!entry || entry.uploadStatus !== 'error') return;
    startUpload([entry], index);
  }, [files, startUpload]);

  const removeFile = useCallback((index) => {
    if (typeof index !== 'number') {
      setFiles([]);
      setActiveFileIndex(0);
    } else {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setActiveFileIndex((prev) => Math.max(0, prev >= files.length - 1 ? prev - 1 : prev));
    }
    setTargetPage(null);
    setCurrentPage(1);
    setTotalPages(0);
  }, [files.length]);

  const goToPage = useCallback((pageNum) => {
    setTargetPage(pageNum);
  }, []);

  const reportPageChange = useCallback((page, total) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);

  return (
    <FileContext.Provider
      value={{
        file,
        files,
        fileType,
        activeFileIndex,
        setActiveFileIndex,
        handleFileSelect,
        removeFile,
        retryUpload,
        targetPage,
        goToPage,
        currentPage,
        totalPages,
        reportPageChange,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}
