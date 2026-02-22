import React, { useState } from 'react';
import {
  TextField,
  Typography,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useThemeMode } from '../theme/ThemeContext';
import { THEME_NAMES, FONT_NAMES } from '../theme/themes';

export default function SettingsContent() {
  const { clearAllSessions } = useChatContext();
  const { personaId, selectPersona, personas } = usePersona();
  const { themeName, setTheme, font, setFont } = useThemeMode();
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('filegeek-gemini-key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('filegeek-api-key') || '');
  const [notionToken, setNotionToken] = useState(() => localStorage.getItem('filegeek-notion-token') || '');
  const [saved, setSaved] = useState(false);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleSaveGemini = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('filegeek-gemini-key', geminiKey.trim());
    } else {
      localStorage.removeItem('filegeek-gemini-key');
    }
    flash();
  };

  const handleSaveOpenai = () => {
    if (openaiKey.trim()) {
      localStorage.setItem('filegeek-api-key', openaiKey.trim());
    } else {
      localStorage.removeItem('filegeek-api-key');
    }
    flash();
  };

  const handleSaveNotionToken = () => {
    if (notionToken.trim()) {
      localStorage.setItem('filegeek-notion-token', notionToken.trim());
    } else {
      localStorage.removeItem('filegeek-notion-token');
    }
    flash();
  };

  const handleClearHistory = () => {
    clearAllSessions();
    flash();
  };

  return (
    <Box>
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: '#E5E5E5', mb: 2 }}>
        SETTINGS
      </Typography>

      {saved && (
        <Box sx={{ border: '1px solid #00FF00', p: 1, mb: 2 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#00FF00' }}>
            OK: SAVED
          </Typography>
        </Box>
      )}

      <Divider sx={{ borderColor: '#333333', my: 2 }} />

      {/* AI Persona */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// DEFAULT_PERSONA`}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
        Choose the personality FileGeek uses to respond.
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>PERSONA</InputLabel>
        <Select
          value={personaId}
          onChange={(e) => selectPersona(e.target.value)}
          label="PERSONA"
          sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
        >
          {personas.map((p) => (
            <MenuItem key={p.id} value={p.id} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {p.label.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ borderColor: '#333333', my: 3 }} />

      {/* Appearance */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// APPEARANCE`}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
        Customize the visual theme and typography of FileGeek.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>THEME_PRESET</InputLabel>
          <Select
            value={themeName}
            onChange={(e) => setTheme(e.target.value)}
            label="THEME_PRESET"
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
          >
            {THEME_NAMES.map((t) => (
              <MenuItem key={t} value={t} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {t.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>TYPOGRAPHY</InputLabel>
          <Select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            label="TYPOGRAPHY"
            sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
          >
            {FONT_NAMES.map((f) => (
              <MenuItem key={f} value={f} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {f.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ borderColor: '#333333', my: 3 }} />

      {/* Gemini API Key */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// GEMINI_API_KEY`}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
        Used when AI_PROVIDER=gemini. Get one from Google AI Studio.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          type="password"
          placeholder="AIza..."
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        />
        <Box
          onClick={handleSaveGemini}
          sx={{
            cursor: 'pointer',
            border: '1px solid #333',
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#E5E5E5',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#00FF00', color: '#00FF00' },
          }}
        >
          [ SAVE ]
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#333333', my: 3 }} />

      {/* OpenAI API Key */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// OPENAI_API_KEY`}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
        Used when AI_PROVIDER=openai, and required for text-to-speech.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          type="password"
          placeholder="sk-..."
          value={openaiKey}
          onChange={(e) => setOpenaiKey(e.target.value)}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        />
        <Box
          onClick={handleSaveOpenai}
          sx={{
            cursor: 'pointer',
            border: '1px solid #333',
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#E5E5E5',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#00FF00', color: '#00FF00' },
          }}
        >
          [ SAVE ]
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#333333', my: 3 }} />

      {/* Notion Integration */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// NOTION_INTEGRATION`}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
        Provide your Notion integration token to enable exporting to Notion.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          type="password"
          placeholder="ntn_..."
          value={notionToken}
          onChange={(e) => setNotionToken(e.target.value)}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        />
        <Box
          onClick={handleSaveNotionToken}
          sx={{
            cursor: 'pointer',
            border: '1px solid #333',
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#E5E5E5',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#00FF00', color: '#00FF00' },
          }}
        >
          [ SAVE ]
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#333333', my: 3 }} />

      {/* Clear History */}
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#E5E5E5', mb: 0.5 }}>
        {`// DATA`}
      </Typography>
      <Box
        onClick={handleClearHistory}
        sx={{
          cursor: 'pointer',
          border: '1px solid #FF0000',
          px: 1.5,
          py: 1,
          display: 'inline-block',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#FF0000',
          '&:hover': { bgcolor: '#FF0000', color: '#000' },
        }}
      >
        [ CLEAR ALL HISTORY ]
      </Box>
    </Box>
  );
}
