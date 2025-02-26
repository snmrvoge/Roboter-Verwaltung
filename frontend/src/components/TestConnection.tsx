import React, { useState, useEffect } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
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
      const text = await response.text();
      console.log('Response text:', text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(text);
      setMessage(data.message);
      setStatus('success');
    } catch (error) {
      console.error('Connection test failed:', error);
      setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <Button 
        variant="contained" 
        onClick={testConnection}
        disabled={status === 'loading'}
        style={{ marginBottom: '10px' }}
      >
        {status === 'loading' ? <CircularProgress size={24} /> : 'Test API Connection'}
      </Button>

      {status !== 'idle' && (
        <Alert severity={status === 'success' ? 'success' : 'error'}>
          {message}
        </Alert>
      )}
    </div>
  );
};
