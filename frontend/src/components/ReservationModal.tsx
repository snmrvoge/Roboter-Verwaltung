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
  Typography,
  Alert,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { Robot, Reservation } from '../types';
import { API_BASE_URL } from '../config';

interface ReservationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  onEdit: (id: string, data: any) => Promise<void>;
  selectedReservation?: Reservation | null;
  availableRobots: Robot[];
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  open,
  onClose,
  onCreate,
  onEdit,
  selectedReservation,
  availableRobots,
  initialStartDate,
  initialEndDate
}) => {
  const [robotId, setRobotId] = useState('');
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [availableRobotsState, setAvailableRobots] = useState<Robot[]>([]);

  const resetForm = () => {
    setRobotId('');
    setEventName('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setError('');
  };

  useEffect(() => {
    if (open) {
      if (selectedReservation) {
        // Wenn eine Reservierung bearbeitet wird, Formular mit den Daten füllen
        const robotId = typeof selectedReservation.robotId === 'string' 
          ? selectedReservation.robotId 
          : (selectedReservation.robotId as Robot)._id;
        setRobotId(robotId);
        setEventName(selectedReservation.eventName);
        setLocation(selectedReservation.location || '');
        
        // Korrigiere die Zeitzone für Start- und Enddatum
        const startDateTime = new Date(selectedReservation.startDate);
        const endDateTime = new Date(selectedReservation.endDate);
        
        setStartDate(formatLocalDateTime(startDateTime));
        setEndDate(formatLocalDateTime(endDateTime));
        
        if (selectedReservation.contactPerson) {
          setContactName(selectedReservation.contactPerson.name || '');
          setContactEmail(selectedReservation.contactPerson.email || '');
          setContactPhone(selectedReservation.contactPerson.phone || '');
        }
      } else {
        // Wenn eine neue Reservierung erstellt wird, Formular zurücksetzen
        resetForm();
        
        // Wenn ein Roboter vorausgewählt wurde, setze ihn
        if (availableRobots.length > 0 && availableRobots[0]._id) {
          setRobotId(availableRobots[0]._id);
        }
        
        // Wenn Start- und Enddatum aus dem Kalender vorausgewählt wurden, setze sie
        if (initialStartDate && initialEndDate) {
          setStartDate(formatLocalDateTime(initialStartDate));
          setEndDate(formatLocalDateTime(initialEndDate));
        } else {
          // Ansonsten setze Standardwerte
          const now = new Date();
          const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 Stunden später
          
          setStartDate(now.toISOString().slice(0, 16));
          setEndDate(fourHoursLater.toISOString().slice(0, 16));
        }
      }
    }
  }, [open, selectedReservation, availableRobots, initialStartDate, initialEndDate]);

  useEffect(() => {
    // Initial alle Roboter als verfügbar setzen
    const initialRobots = availableRobots.filter(robot => robot.status !== 'maintenance');
    console.log('Initiale verfügbare Roboter:', initialRobots);
    setAvailableRobots(initialRobots);
  }, [availableRobots]);

  useEffect(() => {
    const checkAvailableRobots = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Nicht authentifiziert');
        
        console.log('Prüfe verfügbare Roboter für Zeitraum:', startDate, endDate);
        console.log('Alle Roboter:', availableRobots);
        
        const response = await fetch(`${API_BASE_URL}/api/robots/available`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            excludeReservationId: selectedReservation?._id
          }),
        });

        if (!response.ok) throw new Error('Fehler beim Laden der verfügbaren Roboter');
        
        const availableRobotIds = await response.json();
        console.log('Verfügbare Roboter-IDs vom Server:', availableRobotIds);
        
        // Filtere Roboter basierend auf Verfügbarkeit und Status
        const available = availableRobots.filter(robot => {
          // Wenn es eine bestehende Reservierung ist, erlaube den aktuell ausgewählten Roboter immer
          const isCurrentlySelected = selectedReservation && robot._id === (
            typeof selectedReservation.robotId === 'string' 
              ? selectedReservation.robotId 
              : (selectedReservation.robotId as Robot)._id
          );
          
          // Prüfe, ob der Roboter für den Zeitraum verfügbar ist
          const isAvailableForTimeSlot = availableRobotIds.includes(robot._id);
          
          // Wenn wir einen Roboter wegen Wartung wechseln, zeige nur verfügbare Roboter an
          if (selectedReservation && typeof selectedReservation.robotId !== 'string' && 
              (selectedReservation.robotId as Robot).status === 'maintenance' && !isCurrentlySelected) {
            return isAvailableForTimeSlot && robot.status !== 'maintenance';
          }
          
          // Standardfall: Erlaube den aktuell ausgewählten Roboter oder verfügbare Roboter, die nicht in Wartung sind
          return isCurrentlySelected || (isAvailableForTimeSlot && robot.status !== 'maintenance');
        });
          
        console.log('Gefilterte verfügbare Roboter:', available);
        setAvailableRobots(available);
      } catch (err) {
        console.error('Fehler beim Laden der verfügbaren Roboter:', err);
        // Fallback: Zeige alle Roboter außer denen in Wartung
        const fallbackRobots = availableRobots.filter(robot => 
          robot.status !== 'maintenance' || 
          (selectedReservation && robot._id === (
            typeof selectedReservation.robotId === 'string' 
              ? selectedReservation.robotId 
              : (selectedReservation.robotId as Robot)._id
          ))
        );
        console.log('Fallback-Roboter:', fallbackRobots);
        setAvailableRobots(fallbackRobots);
      }
    };

    if (startDate && endDate) {
      checkAvailableRobots();
    }
  }, [startDate, endDate, availableRobots, selectedReservation]);

  useEffect(() => {
    if (availableRobotsState.length === 0 && availableRobots.length > 0) {
      console.log('Setze verfügbare Roboter zurück:', availableRobots);
      const initialRobots = availableRobots.filter(robot => 
        robot.status !== 'maintenance' || 
        (selectedReservation && robot._id === (
          typeof selectedReservation.robotId === 'string' 
            ? selectedReservation.robotId 
            : (selectedReservation.robotId as Robot)._id
        ))
      );
      setAvailableRobots(initialRobots);
    }
  }, [availableRobots, availableRobotsState, selectedReservation]);

  useEffect(() => {
    if (selectedReservation) {
      const robotId = typeof selectedReservation.robotId === 'string' 
        ? selectedReservation.robotId 
        : (selectedReservation.robotId as Robot)._id;
      setRobotId(robotId);
      setEventName(selectedReservation.eventName);
      setLocation(selectedReservation.location);
      
      // Formatiere Datum für Eingabefelder
      const startDateStr = formatLocalDateTime(new Date(selectedReservation.startDate));
      const endDateStr = formatLocalDateTime(new Date(selectedReservation.endDate));
      
      setStartDate(startDateStr);
      setEndDate(endDateStr);
      
      // Kontaktperson
      if (selectedReservation.contactPerson) {
        setContactName(selectedReservation.contactPerson.name || '');
        setContactEmail(selectedReservation.contactPerson.email || '');
        setContactPhone(selectedReservation.contactPerson.phone || '');
      }
    } else {
      resetForm();
    }
  }, [selectedReservation]);

  // Formatiere das Datum im lokalen Format ohne Zeitzonenverschiebung
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Wenn sich das Startdatum ändert, aktualisiere auch das Enddatum, wenn es vor dem Startdatum liegt
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Wenn das Enddatum vor dem neuen Startdatum liegt, setze es auf das Startdatum
    if (endDate && new Date(newStartDate) > new Date(endDate)) {
      setEndDate(newStartDate);
    }
  };

  // Wenn sich das Enddatum ändert, prüfe, ob es nach dem Startdatum liegt
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    
    // Stelle sicher, dass das Enddatum nach dem Startdatum liegt
    if (startDate && new Date(newEndDate) < new Date(startDate)) {
      setError('Das Enddatum muss nach dem Startdatum liegen');
      return;
    }
    
    setEndDate(newEndDate);
    setError(''); // Lösche Fehler, wenn das Datum gültig ist
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      if (!robotId || !startDate || !endDate || !eventName || !location) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus');
      }

      const reservationData = {
        robotId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        eventName,
        location,
        contactPerson: {
          name: contactName || '',
          email: contactEmail || '',
          phone: contactPhone || ''
        }
      };

      try {
        if (selectedReservation) {
          await onEdit(selectedReservation._id, reservationData);
        } else {
          await onCreate(reservationData);
        }
        
        resetForm();
        onClose();
      } catch (apiError: any) {
        console.error('API-Fehler:', apiError);
        
        // Prüfe, ob es sich um einen Konflikt handelt (HTTP 409)
        if (apiError.status === 409) {
          const errorData = await apiError.json();
          setError(errorData.message || 'Der Roboter ist im gewählten Zeitraum bereits reserviert');
        } else {
          setError(apiError.message || 'Fehler beim Speichern der Reservierung');
        }
      }
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      setError(error.message || 'Fehler beim Speichern der Reservierung');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedRobotDetails = availableRobots.find(r => r._id === robotId);
  const otherAvailableRobots = availableRobotsState.filter(r => r._id !== robotId);
  
  console.log('Rendering modal with robotId:', robotId);
  console.log('Available robots for dropdown:', availableRobotsState);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selectedReservation ? 'Reservierung bearbeiten' : 'Neue Reservierung'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="eventName"
              label="Veranstaltungsname"
              name="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="location"
              label="Ort"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="startDate"
              label="Startdatum"
              type="datetime-local"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="endDate"
              label="Enddatum"
              type="datetime-local"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="robot-select-label">Roboter</InputLabel>
              <Select
                labelId="robot-select-label"
                id="robot-select"
                value={robotId}
                label="Roboter *"
                onChange={(e) => setRobotId(e.target.value)}
                disabled={!startDate || !endDate}
              >
                {!startDate || !endDate ? (
                  <MenuItem disabled>
                    <em>Bitte zuerst Start- und Enddatum wählen</em>
                  </MenuItem>
                ) : (
                  availableRobotsState.map((robot) => (
                    <MenuItem key={robot._id} value={robot._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{robot.name}</Typography>
                        <Chip
                          label={robot.type === 'humanoid' ? 'Humanoid' : 'Hund'}
                          color={robot.type === 'humanoid' ? 'primary' : 'success'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                        {robot.status === 'maintenance' && (
                          <Chip
                            icon={<WarningIcon />}
                            label="In Wartung"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {!startDate || !endDate ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Bitte wählen Sie zuerst Start- und Enddatum, um verfügbare Roboter anzuzeigen.
                </Typography>
              ) : availableRobotsState.length === 0 ? (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  Keine Roboter für diesen Zeitraum verfügbar.
                </Typography>
              ) : null}
            </FormControl>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Kontaktperson (optional)
            </Typography>

            <TextField
              margin="normal"
              fullWidth
              id="contactName"
              label="Name"
              name="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />

            <TextField
              margin="normal"
              fullWidth
              id="contactEmail"
              label="E-Mail"
              name="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />

            <TextField
              margin="normal"
              fullWidth
              id="contactPhone"
              label="Telefon"
              name="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button type="submit" variant="contained">
            {selectedReservation ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
