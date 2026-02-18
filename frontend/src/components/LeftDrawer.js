import React, { useState } from 'react';
import { Drawer } from '@mui/material';
import {
  Search,
  Upload,
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Image,
  File,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useFile } from '../contexts/FileContext';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { key: 'all', label: 'ALL FILES', icon: Folder, types: [] },
  { key: 'pdf', label: 'PDFs', icon: FileText, types: ['pdf'] },
  { key: 'image', label: 'IMAGES', icon: Image, types: ['image'] },
  { key: 'document', label: 'DOCS', icon: File, types: ['docx', 'txt'] },
];

// Empty State ASCII Art Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-mono-dim">
      <pre className="text-[10px] leading-tight opacity-30 mb-4">
{`   ___________
  |  _______  |
  | |       | |
  | |       | |
  | |_______| |
  |___________|
   /         \\
  /___________\\`}
      </pre>
      <p className="text-xs font-mono text-center">
        [ NO FILES UPLOADED ]
      </p>
      <p className="text-[10px] font-mono text-center mt-2 opacity-50">
        Upload a file to begin
      </p>
    </div>
  );
}

function DrawerContent({ onClose }) {
  const { logout } = useAuth();
  const { files, activeFileIndex, setActiveFileIndex, handleFileSelect } = useFile();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({ all: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFilteredFiles = (types) => {
    return files.filter((f) => {
      const matchesSearch = (f.name || f.fileName || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (types.length === 0) return true;
      const ext = (f.name || f.fileName || '').split('.').pop().toLowerCase();
      if (types.includes('image') && ['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return true;
      if (types.includes('pdf') && ext === 'pdf') return true;
      if (types.includes('docx') && ext === 'docx') return true;
      if (types.includes('txt') && ext === 'txt') return true;
      return false;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleHome = () => {
    navigate('/');
    if (onClose) onClose();
  };

  const handleCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="h-full flex flex-col bg-mono-black text-mono-light font-mono relative z-10">
      {/* Header - Brand Only */}
      <div className="px-4 py-4 border-b border-mono-gray">
        <h1 className="text-lg font-bold tracking-wider text-mono-light">
          FileGeek
        </h1>
        <p className="text-[10px] text-mono-dim mt-1 uppercase tracking-wide">
          Document Intelligence
        </p>
      </div>

      {/* Search Bar - Separated and Prominent */}
      <div className="px-4 py-3 border-b border-mono-gray">
        <button
          onClick={handleCommandPalette}
          className={`
            w-full flex items-center gap-2 px-3 py-2
            border border-mono-gray bg-mono-black
            transition-all duration-200
            ${searchFocused ? 'border-mono-accent shadow-[0_0_8px_rgba(0,255,0,0.2)]' : 'hover:border-mono-dim'}
          `}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        >
          <Search className="w-4 h-4 text-mono-dim flex-shrink-0" />
          <input
            type="text"
            placeholder="SEARCH FILES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              flex-1 bg-transparent border-none outline-none
              text-mono-light text-xs font-mono
              placeholder:text-mono-dim
            "
            style={{ caretColor: '#00FF00' }}
          />
          <span className="text-[10px] text-mono-dim">⌘K</span>
        </button>
      </div>

      {/* Primary Action - Upload Button */}
      <div className="px-4 py-3 border-b border-mono-gray">
        <label htmlFor="sidebar-upload-input">
          <input
            id="sidebar-upload-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <div
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-3 cursor-pointer
              bg-mono-accent text-mono-black
              border border-mono-accent
              font-bold text-xs tracking-wide uppercase
              transition-all duration-200
              hover:bg-transparent hover:text-mono-accent
              active:scale-[0.98]
            "
          >
            <Upload className="w-4 h-4" />
            <span>Upload New File</span>
          </div>
        </label>
      </div>

      {/* File List Area - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {files.length === 0 && !searchQuery ? (
          <EmptyState />
        ) : (
          <div className="py-2">
            {SECTIONS.map((section) => {
              const sectionFiles = getFilteredFiles(section.types);
              if (section.key !== 'all' && sectionFiles.length === 0) return null;

              const isOpen = openSections[section.key];
              const SectionIcon = section.icon;

              return (
                <div key={section.key} className="mb-1">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="
                      w-full flex items-center gap-2 px-4 py-2
                      text-xs font-bold uppercase tracking-wide
                      text-mono-dim hover:text-mono-light
                      border-l-2 border-transparent
                      hover:bg-mono-gray hover:border-l-2 hover:border-mono-dim
                      transition-all duration-150
                    "
                  >
                    <SectionIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{section.label}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {/* Section Files */}
                  {isOpen && (
                    <div className="py-1">
                      {sectionFiles.length === 0 ? (
                        <div className="px-4 py-2 pl-10 text-[10px] text-mono-dim italic">
                          [NO FILES]
                        </div>
                      ) : (
                        sectionFiles.map((f, idx) => {
                          const globalIndex = files.indexOf(f);
                          const isSelected = globalIndex === activeFileIndex;

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveFileIndex(globalIndex);
                                if (onClose) onClose();
                              }}
                              className={`
                                w-full px-4 py-2 pl-10 text-left
                                text-[11px] font-mono truncate
                                border-l-2 transition-all duration-150
                                ${
                                  isSelected
                                    ? 'bg-[rgba(0,255,0,0.05)] border-l-2 border-mono-accent text-mono-accent shadow-[inset_0_0_8px_rgba(0,255,0,0.1)] backdrop-blur-sm'
                                    : 'border-transparent text-mono-light hover:bg-mono-gray hover:border-mono-dim hover:text-mono-light'
                                }
                              `}
                            >
                              {f.fileName || f.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Navigation & Logout */}
      <div className="border-t border-[#1a1a1a] bg-mono-black">
        <button
          onClick={handleHome}
          className="
            w-full flex items-center gap-3 px-4 py-3
            text-xs font-mono uppercase tracking-wide
            text-mono-dim hover:text-mono-light
            border-l-2 border-transparent
            hover:bg-mono-gray hover:border-mono-dim
            transition-all duration-150
          "
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3
            text-xs font-mono uppercase tracking-wide
            text-mono-dim hover:text-red-500
            border-l-2 border-transparent
            hover:bg-mono-gray hover:border-red-500
            transition-all duration-150
          "
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function LeftDrawer({ open, onClose, embedded }) {
  if (embedded) {
    return <DrawerContent onClose={onClose} />;
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          bgcolor: '#000000',
          color: '#E5E5E5',
          borderRight: '1px solid #1a1a1a',
        }
      }}
    >
      <DrawerContent onClose={onClose} />
    </Drawer>
  );
}
