import React, { useState, useEffect } from 'react';
import { Alert, Button, CircularProgress, Box, Typography, Paper } from '@mui/material';
import { API_BASE_URL } from '../config';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const testConnection = async () => {
    setStatus('loading');
    try {
      console.log('Testing connection to:', `${API_BASE_URL}/api/test`);
      const response = await fetch(`${API_BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message || 'Verbindung zum Server erfolgreich hergestellt!');
      setStatus('success');
    } catch (error) {
      console.error('Connection test failed:', error);
      setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Verbindungstest
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        Klicken Sie auf den Button, um die Verbindung zum Server zu testen.
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={testConnection}
          disabled={status === 'loading'}
          fullWidth
        >
          {status === 'loading' ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Verbindung testen'
          )}
        </Button>
        
        {status === 'success' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            {message}
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert severity="error" sx={{ width: '100%' }}>
            Verbindungsfehler: {message}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};
