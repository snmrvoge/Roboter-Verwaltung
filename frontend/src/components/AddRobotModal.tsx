import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';

interface AddRobotModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (robot: { name: string; type: string; homebase: string }) => Promise<void>;
  token: string | null;
}

export const AddRobotModal: React.FC<AddRobotModalProps> = ({
  open,
  onClose,
  onAdd,
  token,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('humanoid');
  const [homebase, setHomebase] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !type || !homebase) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      await onAdd({ name, type, homebase });
      setName('');
      setType('humanoid');
      setHomebase('');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Fehler beim Erstellen des Roboters');
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neuen Roboter hinzufügen</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label="Typ"
              value={type}
              onChange={(e) => setType(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="humanoid">Humanoid</MenuItem>
              <MenuItem value="dog">Roboterhund</MenuItem>
            </TextField>
            <TextField
              label="Homebase"
              value={homebase}
              onChange={(e) => setHomebase(e.target.value)}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" color="primary">
            Hinzufügen
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
