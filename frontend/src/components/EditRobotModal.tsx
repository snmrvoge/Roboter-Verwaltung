import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Robot } from '../types';

export interface EditRobotModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (robotData: Partial<Robot>) => Promise<void>;
  robot: Robot | null;
}

export const EditRobotModal: React.FC<EditRobotModalProps> = ({
  open,
  onClose,
  onSave,
  robot
}) => {
  const [formData, setFormData] = useState<Partial<Robot>>({
    name: '',
    robotType: 'humanoid',
    status: 'available',
    homebase: ''
  });

  useEffect(() => {
    if (robot) {
      setFormData({
        name: robot.name,
        robotType: robot.robotType,
        status: robot.status,
        homebase: robot.homebase
      });
    } else {
      setFormData({
        name: '',
        robotType: 'humanoid',
        status: 'available',
        homebase: ''
      });
    }
  }, [robot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {robot ? 'Roboter bearbeiten' : 'Neuen Roboter hinzufügen'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Typ</InputLabel>
              <Select
                value={formData.robotType}
                label="Typ"
                onChange={(e) => setFormData({ ...formData, robotType: e.target.value as 'humanoid' | 'dog' })}
              >
                <MenuItem value="humanoid">Humanoid</MenuItem>
                <MenuItem value="dog">Roboterhund</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="available">Verfügbar</MenuItem>
                <MenuItem value="reserved">Reserviert</MenuItem>
                <MenuItem value="maintenance">Wartung</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Homebase"
              value={formData.homebase}
              onChange={(e) => setFormData({ ...formData, homebase: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" color="primary">
            {robot ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
