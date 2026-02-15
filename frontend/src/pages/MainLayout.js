import React, { useState } from 'react';
import { Box, Button, Chip, Tab, Tabs, alpha, useMediaQuery, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TopBar from '../components/TopBar';
import LeftDrawer from '../components/LeftDrawer';
import ChatPanel from '../components/ChatPanel';
import FileViewer from '../components/FileViewer';
import DropZone from '../components/DropZone';
import CommandPalette from '../components/CommandPalette';
import ArtifactPanel from '../components/ArtifactPanel';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useThemeMode } from '../theme/ThemeContext';

const DRAWER_WIDTH = 280;
const GRID_GAP = 8;

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { file, files, fileType, activeFileIndex, setActiveFileIndex, removeFile, targetPage, reportPageChange } = useFile();
  const { clearMessages, artifacts } = useChatContext();
  const { persona } = usePersona();
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile tab state: 0 = document, 1 = chat
  const [mobileTab, setMobileTab] = useState(0);

  const personaBg = mode === 'dark' ? persona.bgDark : persona.bg;

  const handleRemoveFile = () => {
    removeFile();
    clearMessages();
  };

  const effectiveDrawer = isMobile ? false : drawerOpen;
  const hasArtifacts = artifacts && artifacts.length > 0;

  const glassCard = {
    backdropFilter: 'blur(16px) saturate(180%)',
    backgroundColor: mode === 'light'
      ? alpha('#FFFFFF', 0.65)
      : alpha('#1A1A2E', 0.6),
    border: `1px solid ${mode === 'light'
      ? alpha('#94A3B8', 0.15)
      : alpha('#E5E7EB', 0.06)}`,
    borderRadius: '16px',
    overflow: 'hidden',
  };

  // Build grid columns based on state
  const getGridColumns = () => {
    if (isMobile) return '1fr';

    const cols = [];
    if (effectiveDrawer) cols.push(`${DRAWER_WIDTH}px`);
    cols.push('1fr'); // viewer
    cols.push('minmax(320px, 400px)'); // chat — responsive
    if (hasArtifacts) cols.push('minmax(280px, 360px)'); // artifacts
    return cols.join(' ');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: personaBg,
      transition: 'background 0.6s ease',
    }}>
      <TopBar onToggleDrawer={() => setDrawerOpen((d) => !d)} />

      {/* Mobile tab switcher */}
      {isMobile && file && (
        <Tabs
          value={mobileTab}
          onChange={(_, v) => setMobileTab(v)}
          centered
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.85rem' },
          }}
        >
          <Tab label="Document" />
          <Tab label="Chat" />
        </Tabs>
      )}

      {/* Bento Grid Container */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: getGridColumns(),
          gridTemplateRows: '1fr',
          gap: `${GRID_GAP}px`,
          p: `${GRID_GAP}px`,
          overflow: 'hidden',
          transition: 'grid-template-columns 0.25s ease',
        }}
      >
        {/* Drawer Compartment */}
        {effectiveDrawer && (
          <Box
            sx={{
              ...glassCard,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <LeftDrawer open={true} onClose={() => setDrawerOpen(false)} embedded />
          </Box>
        )}

        {/* Document Viewer Compartment */}
        <Box
          sx={{
            ...glassCard,
            display: isMobile && file && mobileTab !== 0 ? 'none' : 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
          }}
        >
          {file ? (
            <>
              {files.length > 1 && (
                <Box sx={{
                  display: 'flex',
                  gap: 0.5,
                  px: 1.5,
                  pt: 1,
                  pb: 0.5,
                  flexWrap: 'wrap',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                  {files.map((f, idx) => {
                    const name = f.fileName || f.name || 'File';
                    return (
                      <Chip
                        key={idx}
                        label={name.length > 20 ? name.slice(0, 17) + '...' : name}
                        size="small"
                        variant={idx === activeFileIndex ? 'filled' : 'outlined'}
                        color={idx === activeFileIndex ? 'primary' : 'default'}
                        onClick={() => setActiveFileIndex(idx)}
                        onDelete={() => { removeFile(idx); }}
                        sx={{
                          maxWidth: 180,
                          borderRadius: '8px',
                          fontWeight: idx === activeFileIndex ? 700 : 500,
                          '& .MuiChip-deleteIcon': {
                            opacity: 0.5,
                            '&:hover': { opacity: 1 },
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              <Button
                size="small"
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={handleRemoveFile}
                sx={{
                  position: 'absolute',
                  top: files.length > 1 ? 48 : 12,
                  right: 12,
                  zIndex: 6,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: alpha('#D32F2F', 0.85),
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: alpha('#D32F2F', 0.95),
                    transform: 'scale(1.03)',
                  },
                  transition: 'transform 0.15s, background-color 0.15s',
                }}
              >
                Remove All
              </Button>
              <FileViewer file={file} fileType={fileType} targetPage={targetPage} onPageChange={reportPageChange} />
            </>
          ) : (
            <DropZone />
          )}
        </Box>

        {/* Chat Compartment */}
        <Box
          sx={{
            ...glassCard,
            display: isMobile && file && mobileTab !== 1 ? 'none' : 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <ChatPanel />
        </Box>

        {/* Artifacts Panel (4th column, appears when artifacts exist) */}
        {!isMobile && hasArtifacts && (
          <Box
            sx={{
              ...glassCard,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <ArtifactPanel />
          </Box>
        )}
      </Box>

      {/* Command Palette (CMD+K) */}
      <CommandPalette />
    </Box>
  );
}
