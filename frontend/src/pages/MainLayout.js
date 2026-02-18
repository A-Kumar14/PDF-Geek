import React, { useState } from 'react';
import { Box, Tab, Tabs, Dialog, DialogContent, useMediaQuery, useTheme } from '@mui/material';
import { Group, Panel, Separator } from 'react-resizable-panels';
import TopBar from '../components/TopBar';
import LeftDrawer from '../components/LeftDrawer';
import ChatPanel from '../components/ChatPanel';
import FileViewer from '../components/FileViewer';
import DropZone from '../components/DropZone';
import CommandPalette from '../components/CommandPalette';
import SettingsContent from './SettingsContent';
import ArtifactPanel from '../components/ArtifactPanel';
import ResearchNotesPanel from '../components/ResearchNotesPanel';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { useHighlights } from '../contexts/HighlightsContext';

const DRAWER_WIDTH = 260; // Slightly narrower for compactness
const BORDER_COLOR = '#333333';

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { file, files, fileType, activeFileIndex, setActiveFileIndex, removeFile, targetPage, reportPageChange } = useFile();
  const { clearMessages, artifacts } = useChatContext();
  const { pinnedNotes, notesPanelOpen } = useHighlights();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile tab state: 0 = document, 1 = chat
  const [mobileTab, setMobileTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const personaBg = '#000000'; // Enforce black

  const handleRemoveFile = () => {
    removeFile();
    clearMessages();
  };

  const effectiveDrawer = isMobile ? false : drawerOpen;
  const hasArtifacts = artifacts && artifacts.length > 0;
  const showNotesPanel = notesPanelOpen;
  const showArtifacts = hasArtifacts && !showNotesPanel;



  const borderStyle = `1px solid ${BORDER_COLOR}`;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: personaBg,
      color: '#E5E5E5',
      overflow: 'hidden',
    }}>
      <Box sx={{ borderBottom: borderStyle }}>
        <TopBar onToggleDrawer={() => setDrawerOpen((d) => !d)} drawerOpen={effectiveDrawer} onOpenSettings={() => setSettingsOpen(true)} />
      </Box>

      {/* Mobile tab switcher */}
      {isMobile && file && (
        <Tabs
          value={mobileTab}
          onChange={(_, v) => setMobileTab(v)}
          centered
          sx={{
            minHeight: 36,
            borderBottom: borderStyle,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              color: '#888',
              '&.Mui-selected': { color: '#E5E5E5' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#00FF00' }
          }}
        >
          <Tab label="[ DOCUMENT ]" />
          <Tab label="[ CHAT ]" />
          {pinnedNotes.length > 0 && <Tab label="[ NOTES ]" />}
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
          // Mobile: Use simple layout without resizing
          <>
            {effectiveDrawer && (
              <Box
                role="complementary"
                aria-label="Session history"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  flexDirection: 'column',
                  minHeight: 0,
                  width: DRAWER_WIDTH,
                  bgcolor: '#000000',
                }}
              >
                <LeftDrawer open={true} onClose={() => setDrawerOpen(false)} embedded />
              </Box>
            )}
            {effectiveDrawer && <Box sx={{ width: '1px', bgcolor: BORDER_COLOR }} />}

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
                bgcolor: '#0D0D0D',
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
                      borderBottom: borderStyle,
                      bgcolor: '#000000',
                    }}>
                      {files.map((f, idx) => {
                        const name = f.fileName || f.name || 'File';
                        return (
                          <Box
                            key={idx}
                            onClick={() => setActiveFileIndex(idx)}
                            sx={{
                              border: `1px solid ${idx === activeFileIndex ? '#E5E5E5' : '#333333'}`,
                              borderBottom: 'none',
                              px: 1.5,
                              py: 0.5,
                              cursor: 'pointer',
                              color: idx === activeFileIndex ? '#E5E5E5' : '#888888',
                              '&:hover': { color: '#FFFFFF', borderColor: '#888888' },
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {name}
                            <Box component="span" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} sx={{ cursor: 'pointer', '&:hover': { color: 'red' } }}>[x]</Box>
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
                      border: '1px solid #333',
                      bgcolor: '#000',
                      px: 1,
                      py: 0.25,
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#888',
                      '&:hover': { borderColor: '#FF0000', color: '#FF0000' },
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
                bgcolor: '#000000',
              }}
            >
              <ChatPanel />
            </Box>
          </>
        ) : (
          // Desktop: Use resizable panels
          <Group direction="horizontal" style={{ width: '100%', height: '100%' }}>
            {/* Drawer Panel */}
            {effectiveDrawer && (
              <>
                <Panel defaultSize={18} minSize={12} maxSize={25} order={1}>
                  <Box
                    role="complementary"
                    aria-label="Session history"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      width: '100%',
                      overflow: 'hidden',
                      bgcolor: '#000000',
                    }}
                  >
                    <LeftDrawer open={true} onClose={() => setDrawerOpen(false)} embedded />
                  </Box>
                </Panel>
                <Separator style={{ width: '1px', background: BORDER_COLOR }} />
              </>
            )}

            {/* Document Viewer Panel */}
            <Panel defaultSize={effectiveDrawer ? 47 : 65} minSize={30} order={2}>
              <Box
                role="region"
                aria-label="Document viewer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  height: '100%',
                  width: '100%',
                  overflow: 'hidden',
                  bgcolor: '#0D0D0D',
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
                        borderBottom: borderStyle,
                        bgcolor: '#000000',
                      }}>
                        {files.map((f, idx) => {
                          const name = f.fileName || f.name || 'File';
                          return (
                            <Box
                              key={idx}
                              onClick={() => setActiveFileIndex(idx)}
                              sx={{
                                border: `1px solid ${idx === activeFileIndex ? '#E5E5E5' : '#333333'}`,
                                borderBottom: 'none',
                                px: 1.5,
                                py: 0.5,
                                cursor: 'pointer',
                                color: idx === activeFileIndex ? '#E5E5E5' : '#888888',
                                '&:hover': { color: '#FFFFFF', borderColor: '#888888' },
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              {name}
                              <Box component="span" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} sx={{ cursor: 'pointer', '&:hover': { color: 'red' } }}>[x]</Box>
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
                        border: '1px solid #333',
                        bgcolor: '#000',
                        px: 1,
                        py: 0.25,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#888',
                        '&:hover': { borderColor: '#FF0000', color: '#FF0000' },
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
            </Panel>

            {/* Resize Handle */}
            <Separator
              style={{
                width: '4px',
                background: BORDER_COLOR,
                cursor: 'col-resize',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#000000',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '4px',
                  fontSize: '0.6rem',
                  color: '#888',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  '&:hover': {
                    bgcolor: '#1A1A1A',
                    borderColor: '#00FF00',
                    color: '#00FF00',
                  },
                }}
              >
                ⋮
              </Box>
            </Separator>

            {/* Chat Panel */}
            <Panel defaultSize={35} minSize={25} order={3}>
              <Box
                id="main-content"
                role="main"
                aria-label="Chat"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  overflow: 'hidden',
                  bgcolor: '#000000',
                }}
              >
                <ChatPanel />
              </Box>
            </Panel>

            {/* Artifacts/Notes Panel */}
            {(showNotesPanel || showArtifacts) && (
              <>
                <Separator style={{ width: '1px', background: BORDER_COLOR, flexShrink: 0 }} />
                <Panel defaultSize={20} minSize={15} maxSize={30} order={4}>
                  <Box
                    role="complementary"
                    aria-label="Side panel"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      width: '100%',
                      overflow: 'hidden',
                      bgcolor: '#000000',
                    }}
                  >
                    {showNotesPanel ? <ResearchNotesPanel /> : <ArtifactPanel />}
                  </Box>
                </Panel>
              </>
            )}
          </Group>
        )}
      </Box>

      {/* Mobile: Research Notes tab */}
      {isMobile && pinnedNotes.length > 0 && (
        <Box
          role="complementary"
          aria-label="Research notes"
          sx={{
            display: mobileTab === 2 ? 'flex' : 'none',
            flexDirection: 'column',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            bgcolor: '#000000',
          }}
        >
          <ResearchNotesPanel />
        </Box>
      )}

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
    </Box>
  );
}
