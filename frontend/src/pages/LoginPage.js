import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#000000',
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            p: 4,
            border: '1px solid #333333',
            bgcolor: '#0D0D0D',
          }}
        >
          {/* Branding */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.5rem', color: '#00FF00', letterSpacing: '0.1em' }}>
              FileGeek
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Box sx={{ border: '1px solid #FF0000', p: 1, mb: 2 }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#FF0000' }}>
                ERROR: {error}
              </Typography>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <TextField
              fullWidth
              label="PASSWORD"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                py: 1.2,
                bgcolor: '#E5E5E5',
                color: '#000',
                fontFamily: 'monospace',
                fontWeight: 700,
                '&:hover': { bgcolor: '#FFFFFF' },
                '&.Mui-disabled': { bgcolor: '#333', color: '#888' },
              }}
            >
              {loading ? '[ AUTHENTICATING... ]' : '[ SIGN IN ]'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
              No account?{' '}
              <Typography
                component={RouterLink}
                to="/signup"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#00FF00', textDecoration: 'none', fontWeight: 700 }}
              >
                [ SIGN UP ]
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
