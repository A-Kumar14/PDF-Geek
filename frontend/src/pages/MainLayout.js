import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Dialog, DialogContent, Typography, useMediaQuery, useTheme } from '@mui/material';
import TopBar from '../components/TopBar';
import ChatPanel from '../components/ChatPanel';
import FileViewer from '../components/FileViewer';
import DropZone from '../components/DropZone';
import CommandPalette from '../components/CommandPalette';
import SettingsContent from './SettingsContent';
import ArtifactPanel from '../components/ArtifactPanel';
import GlobalCommandBar from '../components/GlobalCommandBar';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';


export default function MainLayout() {
  const { file, files, fileType, activeFileIndex, setActiveFileIndex, removeFile, targetPage, reportPageChange } = useFile();
  const { clearMessages, artifacts } = useChatContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile tab state: 0 = document, 1 = chat
  const [mobileTab, setMobileTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // '?' key opens shortcuts cheat-sheet
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        setShortcutsOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const personaBg = '#000000'; // Enforce black

  const handleRemoveFile = () => {
    removeFile();
    clearMessages();
  };

  const hasArtifacts = artifacts && artifacts.length > 0;
  const showArtifacts = hasArtifacts;



  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg-primary)',
      color: 'var(--fg-primary)',
      overflow: 'hidden',
    }}>
      <Box sx={{ borderBottom: '1px solid var(--border)' }}>
        <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      </Box>

      {/* Mobile tab switcher */}
      {isMobile && file && (
        <Tabs
          value={mobileTab}
          onChange={(_, v) => setMobileTab(v)}
          centered
          sx={{
            minHeight: 36,
            borderBottom: '1px solid var(--border)',
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: 'var(--fg-secondary)',
              '&.Mui-selected': { color: 'var(--fg-primary)' }
            },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--accent)' }
          }}
        >
          <Tab label="[ DOCUMENT ]" />
          <Tab label="[ CHAT ]" />
        </Tabs>
      )}

      {/* Resizable Panel Container */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {isMobile ? (
          // Mobile: Use simple layout without sidebar
          <>

            {/* Document Viewer */}
            <Box
              role="region"
              aria-label="Document viewer"
              sx={{
                display: file && mobileTab !== 0 ? 'none' : 'flex',
                flexDirection: 'column',
                position: 'relative',
                flex: 1,
                minHeight: 0,
                bgcolor: 'var(--bg-primary)',
              }}
            >
              {file ? (
                <>
                  {files.length > 1 && (
                    <Box sx={{
                      display: 'flex',
                      gap: 0.5,
                      px: 1,
                      pt: 1,
                      pb: 0,
                      flexWrap: 'wrap',
                      borderBottom: '1px solid var(--border)',
                      bgcolor: 'var(--bg-secondary)',
                    }}>
                      {files.map((f, idx) => {
                        const name = f.fileName || f.name || 'File';
                        return (
                          <Box
                            key={idx}
                            onClick={() => setActiveFileIndex(idx)}
                            sx={{
                              border: `1px solid ${idx === activeFileIndex ? 'var(--fg-primary)' : 'var(--border)'}`,
                              borderBottom: 'none',
                              px: 1.5,
                              py: 0.5,
                              cursor: 'pointer',
                              color: idx === activeFileIndex ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                              '&:hover': { color: 'var(--fg-primary)', borderColor: 'var(--fg-secondary)' },
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {name}
                            <Box component="span" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} sx={{ cursor: 'pointer', '&:hover': { color: 'var(--error)' } }}>[x]</Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  <Box
                    onClick={handleRemoveFile}
                    sx={{
                      position: 'absolute',
                      top: files.length > 1 ? 48 : 12,
                      right: 12,
                      zIndex: 6,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      bgcolor: 'var(--bg-secondary)',
                      px: 1,
                      py: 0.25,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--fg-secondary)',
                      '&:hover': { borderColor: 'var(--error)', color: 'var(--error)' },
                    }}
                  >
                    [x CLOSE]
                  </Box>
                  <FileViewer file={file} fileType={fileType} targetPage={targetPage} onPageChange={reportPageChange} />
                </>
              ) : (
                <DropZone />
              )}
            </Box>

            {/* Chat Panel */}
            <Box
              id="main-content"
              role="main"
              aria-label="Chat"
              sx={{
                display: file && mobileTab !== 1 ? 'none' : 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                bgcolor: 'var(--bg-primary)',
              }}
            >
              <ChatPanel />
            </Box>
          </>
        ) : (
          // Desktop: CSS Grid Bento Layout
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '240px 1fr 400px',
              width: '100%',
              height: '100%',
              bgcolor: 'var(--bg-primary)',
              gap: '1px', // Creates border effect via background bleed
              bgcolor: 'var(--border)',
            }}
          >
            {/* Left Column: File Inventory & Persona Settings (Placeholder for now) */}
            <Box sx={{ bgcolor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid var(--border)' }}>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--fg-dim)' }}>
                   // INVENTORY
                </Typography>
              </Box>
              {/* Note: In a future step, DropZone/File List logic can be moved here entirely */}
              <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                <Typography sx={{ color: 'var(--fg-secondary)', fontSize: '0.8rem' }}>Left sidebar content...</Typography>
              </Box>
            </Box>

            {/* Center Column: Document Viewer or Discovery Dashboard */}
            <Box
              role="region"
              aria-label="Document viewer"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: '100%',
                overflow: 'hidden',
                bgcolor: 'var(--bg-primary)',
              }}
            >
              {file ? (
                <>
                  {files.length > 1 && (
                    <Box sx={{
                      display: 'flex',
                      gap: 0.5,
                      px: 1,
                      pt: 1,
                      pb: 0,
                      flexWrap: 'wrap',
                      borderBottom: '1px solid var(--border)',
                      bgcolor: 'var(--bg-secondary)',
                    }}>
                      {files.map((f, idx) => {
                        const name = f.fileName || f.name || 'File';
                        return (
                          <Box
                            key={idx}
                            onClick={() => setActiveFileIndex(idx)}
                            sx={{
                              border: `1px solid ${idx === activeFileIndex ? 'var(--fg-primary)' : 'var(--border)'}`,
                              borderBottom: 'none',
                              px: 1.5,
                              py: 0.5,
                              cursor: 'pointer',
                              color: idx === activeFileIndex ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                              '&:hover': { color: 'var(--fg-primary)', borderColor: 'var(--fg-secondary)' },
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {name}
                            <Box component="span" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} sx={{ cursor: 'pointer', '&:hover': { color: 'var(--error)' } }}>[x]</Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  <Box
                    onClick={handleRemoveFile}
                    sx={{
                      position: 'absolute',
                      top: files.length > 1 ? 48 : 12,
                      right: 12,
                      zIndex: 6,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      bgcolor: 'var(--bg-secondary)',
                      px: 1,
                      py: 0.25,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--fg-secondary)',
                      '&:hover': { borderColor: 'var(--error)', color: 'var(--error)' },
                    }}
                  >
                    [x CLOSE]
                  </Box>
                  <FileViewer file={file} fileType={fileType} targetPage={targetPage} onPageChange={reportPageChange} />
                </>
              ) : (
                <DropZone />
              )}
            </Box>

            {/* Right Column: Agentic Activity Stream (Chat + Artifacts) */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'var(--bg-primary)',
              }}
            >
              {/* Main Chat / Reasoning Log */}
              <Box
                id="main-content"
                role="main"
                aria-label="Agentic Reasoning Log"
                sx={{
                  flex: showArtifacts ? '0 0 60%' : 1, // Take up 60% of right rail if artifacts exist
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderBottom: showArtifacts ? '1px solid var(--border)' : 'none',
                }}
              >
                <ChatPanel />
              </Box>

              {/* Artifacts Panel (Bottom half of Right Column) */}
              {showArtifacts && (
                <Box
                  role="complementary"
                  aria-label="Artifacts panel"
                  sx={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <ArtifactPanel />
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Global warp-style command input */}
      <GlobalCommandBar />

      {/* Command Palette (CMD+K) */}
      <CommandPalette />

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0D0D0D',
            color: '#E5E5E5',
            border: '1px solid #333333',
            borderRadius: 0,
          },
        }}
      >
        <DialogContent>
          <SettingsContent />
        </DialogContent>
      </Dialog>
      {/* Shortcuts cheat-sheet dialog */}
      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#0D0D0D', color: '#E5E5E5', border: '1px solid #333', borderRadius: 0 } }}
      >
        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 2, textTransform: 'uppercase' }}>{'// Keyboard Shortcuts'}</Typography>
          {[
            ['cmd+K', 'Open Command Palette'],
            ['?', 'Toggle this cheat-sheet'],
            ['Esc', 'Close dialogs / palette'],
            ['Enter', 'Send message'],
          ].map(([key, desc]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid #1A1A1A' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#E5E5E5' }}>{desc}</Typography>
              <Box sx={{ border: '1px solid #333', px: 1, py: 0.25, fontFamily: 'monospace', fontSize: '0.65rem', color: '#FFAA00', borderRadius: 0 }}>{key}</Box>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
