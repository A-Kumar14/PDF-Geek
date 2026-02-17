import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.5rem', color: '#00FF00', letterSpacing: '0.1em' }}>
              FileGeek
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
              Create your account
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
              fullWidth label="NAME" value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }} autoFocus
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <TextField
              fullWidth label="EMAIL" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <TextField
              fullWidth label="PASSWORD" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <TextField
              fullWidth label="CONFIRM_PASSWORD" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <Button
              fullWidth variant="contained" type="submit" disabled={loading}
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
              {loading ? '[ CREATING... ]' : '[ SIGN UP ]'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
              Have an account?{' '}
              <Typography
                component={RouterLink}
                to="/login"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#00FF00', textDecoration: 'none', fontWeight: 700 }}
              >
                [ SIGN IN ]
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
