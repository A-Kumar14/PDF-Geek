import React, { useState } from 'react';
import { Box, Button, Chip, Tab, Tabs, Dialog, DialogContent, alpha, useMediaQuery, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
import { usePersona } from '../contexts/PersonaContext';
import { useHighlights } from '../contexts/HighlightsContext';
import { useThemeMode } from '../theme/ThemeContext';

const DRAWER_WIDTH = 260; // Slightly narrower for compactness
const BORDER_COLOR = '#333333';

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { file, files, fileType, activeFileIndex, setActiveFileIndex, removeFile, targetPage, reportPageChange } = useFile();
  const { clearMessages, artifacts } = useChatContext();
  const { persona } = usePersona();
  const { pinnedNotes, notesPanelOpen } = useHighlights();
  const { mode } = useThemeMode();
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

  // Build grid columns based on state
  const getGridColumns = () => {
    if (isMobile) return '1fr';

    const cols = [];
    if (effectiveDrawer) cols.push(`${DRAWER_WIDTH}px`);
    cols.push('1fr'); // viewer
    cols.push('minmax(320px, 400px)'); // chat — responsive
    if (showNotesPanel) cols.push('minmax(280px, 360px)'); // research notes
    else if (showArtifacts) cols.push('minmax(280px, 360px)'); // artifacts
    return cols.join(' auto '); // Use 'auto' or explicit gap simulation if needed, but we'll use border-right approach
  };

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

      {/* Grid Container */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : (effectiveDrawer ? `${DRAWER_WIDTH}px 1px 1fr 1px minmax(320px, 400px)` + (showNotesPanel || showArtifacts ? ` 1px minmax(280px, 360px)` : '') : '1fr 1px minmax(320px, 400px)' + (showNotesPanel || showArtifacts ? ` 1px minmax(280px, 360px)` : '')),
          gridTemplateRows: '1fr',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Compartment */}
        {effectiveDrawer && (
          <Box
            role="complementary"
            aria-label="Session history"
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              minHeight: 0,
              bgcolor: '#000000',
            }}
          >
            <LeftDrawer open={true} onClose={() => setDrawerOpen(false)} embedded />
          </Box>
        )}

        {/* Vertical Divider */}
        {!isMobile && effectiveDrawer && <Box sx={{ width: '1px', bgcolor: BORDER_COLOR }} />}

        {/* Document Viewer Compartment */}
        <Box
          role="region"
          aria-label="Document viewer"
          sx={{
            display: isMobile && file && mobileTab !== 0 ? 'none' : 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
            bgcolor: '#0D0D0D', // Slightly different shade for viewer area
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

              <Button
                size="small"
                onClick={handleRemoveFile}
                sx={{
                  position: 'absolute',
                  top: files.length > 1 ? 48 : 12,
                  right: 12,
                  zIndex: 6,
                  textTransform: 'uppercase',
                  border: '1px solid #FF0000',
                  color: '#FF0000',
                  bgcolor: 'transparent',
                  fontFamily: 'monospace',
                  minWidth: 'auto',
                  px: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 0, 0, 0.1)',
                  },
                }}
              >
                [ REMOVE ALL ]
              </Button>
              <FileViewer file={file} fileType={fileType} targetPage={targetPage} onPageChange={reportPageChange} />
            </>
          ) : (
            <DropZone />
          )}
        </Box>

        {/* Vertical Divider */}
        {!isMobile && <Box sx={{ width: '1px', bgcolor: BORDER_COLOR }} />}

        {/* Chat Compartment */}
        <Box
          id="main-content"
          role="main"
          aria-label="Chat"
          sx={{
            display: isMobile && file && mobileTab !== 1 ? 'none' : 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: '#000000',
          }}
        >
          <ChatPanel />
        </Box>

        {/* Vertical Divider */}
        {!isMobile && (showNotesPanel || showArtifacts) && <Box sx={{ width: '1px', bgcolor: BORDER_COLOR }} />}

        {/* Research Notes / Artifacts Panel */}
        {!isMobile && (showNotesPanel || showArtifacts) && (
          <Box
            role="complementary"
            aria-label="Side panel"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              bgcolor: '#000000',
            }}
          >
            {showNotesPanel ? <ResearchNotesPanel /> : <ArtifactPanel />}
          </Box>
        )}


        {/* Mobile: Research Notes tab */}
        {isMobile && pinnedNotes.length > 0 && (
          <Box
            role="complementary"
            aria-label="Research notes"
            sx={{
              display: mobileTab === 2 ? 'flex' : 'none',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <ResearchNotesPanel />
          </Box>
        )}
      </Box>

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
