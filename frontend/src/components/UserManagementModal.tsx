import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  SelectChangeEvent
} from '@mui/material';

interface UserData {
  _id?: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: string;
}

interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: UserData) => Promise<void>;
  user?: UserData | null;
  isNewUser: boolean;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onClose,
  onSave,
  user,
  isNewUser
}) => {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'user'
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wenn ein Benutzer zum Bearbeiten übergeben wird, setze die Formulardaten
  useEffect(() => {
    if (user && !isNewUser) {
      setUserData({
        ...user,
        password: '' // Passwort wird beim Bearbeiten nicht angezeigt
      });
    } else {
      // Zurücksetzen für neuen Benutzer
      setUserData({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'user'
      });
    }
  }, [user, isNewUser, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name as string]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validierung
    if (!userData.username || !userData.name || !userData.email || !userData.role) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    // Bei neuem Benutzer muss ein Passwort angegeben werden
    if (isNewUser && (!userData.password || userData.password.length < 6)) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    try {
      setLoading(true);
      await onSave(userData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isNewUser ? 'Neuen Benutzer erstellen' : 'Benutzer bearbeiten'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Benutzername"
            name="username"
            autoComplete="username"
            value={userData.username}
            onChange={handleChange}
            autoFocus
          />
          
          {isNewUser && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Passwort"
              type="password"
              id="password"
              autoComplete="new-password"
              value={userData.password}
              onChange={handleChange}
            />
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Vollständiger Name"
            name="name"
            autoComplete="name"
            value={userData.name}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-Mail-Adresse"
            name="email"
            autoComplete="email"
            value={userData.email}
            onChange={handleChange}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Rolle</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={userData.role}
              label="Rolle"
              onChange={handleChange}
            >
              <MenuItem value="user">Benutzer</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Speichern...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
