import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { TestConnection } from '../components/TestConnection';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login-Versuch mit:', email);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login fehlgeschlagen');
      }

      const data = await response.json();
      console.log('Login erfolgreich:', data);
      
      await login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login-Fehler:', error);
      setError('Ungültige E-Mail oder Passwort');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Roboter-Verwaltung
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Anmelden
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleLogin}>
            <TextField
              label="E-Mail"
              type="email"
              fullWidth
              margin="normal"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <TextField
              label="Passwort"
              type="password"
              fullWidth
              margin="normal"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Box mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Anmelden'}
              </Button>
            </Box>
          </form>
          
          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              Standardbenutzer:<br />
              Admin: admin@example.com / password123<br />
              Benutzer: user@example.com / password123
            </Typography>
          </Box>
        </Paper>
        
        <Box mt={4}>
          <TestConnection />
        </Box>
      </Box>
    </Container>
  );
};
