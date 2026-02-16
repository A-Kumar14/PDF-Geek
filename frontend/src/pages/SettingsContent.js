import React, { useState } from 'react';
import {
  TextField,
  Typography,
  Box,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useThemeMode } from '../theme/ThemeContext';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';

export default function SettingsContent() {
  const { mode, toggleMode } = useThemeMode();
  const { clearAllSessions } = useChatContext();
  const { personaId, selectPersona, personas } = usePersona();
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
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Settings
      </Typography>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Saved</Alert>}

      <Divider sx={{ my: 2 }} />

      {/* AI Persona */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Default AI Persona
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Choose the personality FileGeek uses to respond.
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Persona</InputLabel>
        <Select
          value={personaId}
          onChange={(e) => selectPersona(e.target.value)}
          label="Persona"
        >
          {personas.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Gemini API Key */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Google Gemini API Key
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
        />
        <Button variant="contained" onClick={handleSaveGemini}>Save</Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* OpenAI API Key */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        OpenAI API Key
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
        />
        <Button variant="contained" onClick={handleSaveOpenai}>Save</Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Appearance */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Appearance
      </Typography>
      <FormControlLabel
        control={<Switch checked={mode === 'dark'} onChange={toggleMode} />}
        label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      />

      <Divider sx={{ my: 3 }} />

      {/* Notion Integration */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Notion Integration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
        />
        <Button variant="contained" onClick={handleSaveNotionToken}>Save</Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Clear History */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Data
      </Typography>
      <Button
        variant="outlined"
        color="error"
        onClick={handleClearHistory}
        sx={{ textTransform: 'none' }}
      >
        Clear All Chat History
      </Button>
    </Box>
  );
}
