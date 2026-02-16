import React from 'react';
import { Container, Paper, Box, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import SettingsContent from './SettingsContent';

export default function SettingsPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            backdropFilter: 'blur(16px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <SettingsContent />
        </Paper>
      </Container>
    </Box>
  );
}
