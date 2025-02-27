import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Snackbar,
  Container,
  AlertColor,
  Paper,
  Grid,
  Menu,
  MenuItem,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { RobotList } from '../components/RobotList';
import { ReservationModal } from '../components/ReservationModal';
import { AddRobotModal } from '../components/AddRobotModal';
import { EditRobotModal } from '../components/EditRobotModal';
import { ReservationList } from '../components/ReservationList';
import { ReservationCalendar } from '../components/ReservationCalendar';
import { Robot, Reservation, User } from '../types';
import { CalendarEvent } from '../components/ReservationCalendar';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PasswordChangeModal } from '../components/PasswordChangeModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface DashboardViewProps {
  // ... existing props
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DashboardView: React.FC = () => {
  const { token, user } = useAuth();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(null as unknown as undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(null as unknown as undefined);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isAddRobotModalOpen, setIsAddRobotModalOpen] = useState(false);
  const [isEditRobotModalOpen, setIsEditRobotModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [calendarUrl, setCalendarUrl] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Füge ein Kontextmenü für Kalendereinträge hinzu
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    event: CalendarEvent | null;
  } | null>(null);

  const handleEventContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX - 2,
      mouseY: e.clientY - 4,
      event: event
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Finde die entsprechende Reservierung
    const reservation = reservations.find(r => r._id === event.id);
    if (reservation) {
      setSelectedReservation(reservation);
      setIsReservationModalOpen(true);
    }
  };

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Geladene Benutzerdaten:', parsedUser);
          setCurrentUser(parsedUser);
        } catch (error) {
          console.error('Fehler beim Parsen der Benutzerdaten:', error);
        }
      }
    };

    loadUserData();
    fetchRobots();
    fetchReservations();
  }, []);

  const canEditReservation = (reservation: Reservation) => {
    if (!currentUser) return false;
    if (!reservation.userId) return false;
    
    // Handle the case where userId might be a string (just the ID) or an object with _id
    const reservationUserId = typeof reservation.userId === 'string' 
      ? reservation.userId 
      : reservation.userId._id;

    console.log('Prüfe Bearbeitungsrechte:', {
      currentUser,
      reservationUserId,
      userRole: currentUser.role
    });
    
    return currentUser.role === 'admin' || currentUser._id === reservationUserId;
  };

  const renderReservationActions = (reservation: Reservation) => {
    if (!reservation || !canEditReservation(reservation)) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => handleEditClick(reservation)}
          color="primary"
          title="Bearbeiten"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteClick(reservation._id)}
          color="error"
          title="Löschen"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };

  const renderReservationsList = () => {
    if (!reservations || reservations.length === 0) {
      return (
        <Alert severity="info">
          Keine Reservierungen vorhanden
        </Alert>
      );
    }

    return (
      <List>
        {reservations.map((reservation: Reservation) => {
          if (!reservation) return null;
          const robotName = typeof reservation.robotId === 'string'
            ? 'Unbekannter Roboter'
            : (reservation.robotId as Robot).name || 'Unbekannter Roboter';
          
          return (
            <ListItem
              key={reservation._id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {reservation.eventName} - {robotName}
                    </Typography>
                    {renderReservationActions(reservation)}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ort: {reservation.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Von: {reservation.startDate ? new Date(reservation.startDate).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Nicht angegeben'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bis: {reservation.endDate ? new Date(reservation.endDate).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Nicht angegeben'}
                    </Typography>
                    {reservation.contactPerson?.name && (
                      <Typography variant="body2" color="text.secondary">
                        Kontakt: {reservation.contactPerson.name}
                        {reservation.contactPerson.email && ` (${reservation.contactPerson.email})`}
                        {reservation.contactPerson.phone && ` - Tel: ${reservation.contactPerson.phone}`}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  const fetchRobots = async () => {
    try {
      if (!token) {
        setError('Nicht authentifiziert');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/robots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setRobots(data);
      setError('');
    } catch (err) {
      console.error('Fehler beim Laden der Roboter:', err);
      setError('Fehler beim Laden der Roboter');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Lade Reservierungen...');
      const response = await fetch(`${API_BASE_URL}/api/robots/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server-Antwort nicht OK:', response.status, errorText);
        throw new Error(errorText || 'Fehler beim Laden der Reservierungen');
      }

      const data = await response.json();
      console.log('Geladene Reservierungen:', data);
      
      if (!Array.isArray(data)) {
        console.error('Unerwartetes Datenformat:', data);
        throw new Error('Unerwartetes Datenformat der Reservierungen');
      }

      // Die Reservierungen sind bereits auf dem Server sortiert (neueste zuerst)
      console.log('Reservierungen vom Server (bereits sortiert):', data);
      setReservations(data);
      
      // Aktualisiere die Roboter-Status basierend auf den Reservierungen
      const now = new Date();
      const robotUpdates = new Map();
      
      data.forEach((reservation: Reservation) => {
        const start = new Date(reservation.startDate);
        const end = new Date(reservation.endDate);
        
        if (start <= now && end >= now) {
          const robotId = typeof reservation.robotId === 'string'
            ? reservation.robotId
            : (reservation.robotId as Robot)._id;
          robotUpdates.set(robotId, 'reserved');
        }
      });
      
      setRobots(prevRobots => 
        prevRobots.map(robot => ({
          ...robot,
          status: robotUpdates.get(robot._id) || robot.status
        }))
      );
    } catch (err) {
      console.error('Fehler beim Laden der Reservierungen:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRobots();
    fetchReservations();
  }, [token]);

  const canModifyRobot = () => {
    return user?.role === 'admin';
  };

  const handleReserve = (robot: Robot) => {
    if (robot.status !== 'available') {
      setError('Dieser Roboter ist momentan nicht verfügbar');
      return;
    }
    setSelectedRobot(robot);
    setIsReservationModalOpen(true);
  };

  const handleCalendarReserve = (robot: Robot, start: Date, end: Date) => {
    setSelectedRobot(robot);
    setSelectedStartDate(start);
    setSelectedEndDate(end);
    setIsReservationModalOpen(true);
  };

  const handleReservationComplete = async () => {
    setIsReservationModalOpen(false);
    setSelectedRobot(null);
    setSelectedReservation(null);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    await fetchReservations();
    await fetchRobots();
  };

  const handleAddRobotComplete = async () => {
    setIsAddRobotModalOpen(false);
    await fetchRobots();
  };

  const handleEditRobotComplete = async (robotData: Partial<Robot>) => {
    if (!selectedRobot) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/robots/${selectedRobot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(robotData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Roboters');
      }

      const updatedRobot = await response.json();
      setRobots(robots.map(robot => 
        robot._id === selectedRobot._id ? updatedRobot : robot
      ));
      setIsEditRobotModalOpen(false);
      setSelectedRobot(null);
    } catch (err) {
      setError('Fehler beim Aktualisieren des Roboters');
      console.error(err);
    }
  };

  const handleDeleteRobot = async (robotId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/robots/${robotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Löschen des Roboters');
      }

      setRobots(prevRobots => prevRobots.filter(robot => robot._id !== robotId));
      setSnackbar({
        open: true,
        message: 'Roboter erfolgreich gelöscht',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Fehler beim Löschen des Roboters',
        severity: 'error'
      });
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/robots/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Reservierung');
      }

      fetchReservations();
      fetchRobots();
    } catch (err) {
      console.error('Fehler beim Löschen der Reservierung:', err);
      setError('Fehler beim Löschen der Reservierung');
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    // Wenn robotId ein String ist, finde den entsprechenden Roboter
    if (typeof reservation.robotId === 'string') {
      const robot = robots.find(r => r._id === reservation.robotId);
      setSelectedRobot(robot || null);
    } else {
      // Wenn robotId bereits ein Robot-Objekt ist
      setSelectedRobot(reservation.robotId as Robot);
    }
    setSelectedStartDate(undefined); // Reset der ausgewählten Daten, da sie aus der Reservierung kommen
    setSelectedEndDate(undefined);
    setIsReservationModalOpen(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateReservation = async (data: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Nicht authentifiziert');
    }

    try {
      console.log('Sende Reservierungsdaten:', data);
      const response = await fetch(`${API_BASE_URL}/api/robots/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log('Server Antwort:', responseData);

      if (!response.ok) {
        // Wenn es eine Konfliktmeldung ist (409), werfe einen speziellen Fehler mit der Nachricht
        if (response.status === 409) {
          const error = new Error(responseData.message || 'Der Roboter ist im gewählten Zeitraum bereits reserviert');
          error.name = 'ConflictError';
          throw error;
        }
        throw new Error(responseData.message || 'Fehler beim Erstellen der Reservierung');
      }

      await fetchReservations();
      
      setSnackbar({
        open: true,
        message: 'Reservierung erfolgreich erstellt',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Detaillierter Fehler:', err);
      
      // Zeige die Fehlermeldung in der Snackbar an
      setSnackbar({
        open: true,
        message: err.message || 'Fehler beim Erstellen der Reservierung',
        severity: 'error'
      });
      
      throw err;
    }
  };

  const handleUpdateReservation = async (reservationId: string, updatedData: any) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token für Update:', token);
      console.log('Update-Daten:', updatedData);

      const response = await fetch(`${API_BASE_URL}/api/robots/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();
      console.log('Server-Antwort:', data);

      if (!response.ok) {
        // Wenn es eine Konfliktmeldung ist (409), werfe einen speziellen Fehler mit der Nachricht
        if (response.status === 409) {
          const error = new Error(data.message || 'Der Roboter ist im gewählten Zeitraum bereits reserviert');
          error.name = 'ConflictError';
          throw error;
        }
        throw new Error(data.message || 'Fehler beim Aktualisieren der Reservierung');
      }

      // Aktualisiere die lokale Liste
      setReservations(prevReservations =>
        prevReservations.map(res =>
          res._id === reservationId ? { ...res, ...data } : res
        )
      );

      setSnackbar({
        open: true,
        message: 'Reservierung erfolgreich aktualisiert',
        severity: 'success'
      });
      
      await fetchReservations();
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Fehler beim Aktualisieren der Reservierung',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login-Antwort:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login fehlgeschlagen');
      }

      // Speichere Token und Benutzerdaten
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);

      setSnackbar({
        open: true,
        message: 'Erfolgreich angemeldet',
        severity: 'success'
      });

      await fetchReservations();
    } catch (error: any) {
      console.error('Login-Fehler:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Login fehlgeschlagen',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleEditClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsReservationModalOpen(true);
  };

  const handleDeleteClick = async (reservationId: string) => {
    if (!window.confirm('Möchten Sie diese Reservierung wirklich löschen?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/robots/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Löschen der Reservierung');
      }

      setReservations(prev => prev.filter(r => r._id !== reservationId));
      setSnackbar({
        open: true,
        message: 'Reservierung erfolgreich gelöscht',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Fehler beim Löschen der Reservierung',
        severity: 'error'
      });
    }
  };

  const handleEdit = (robot: Robot) => {
    if (!canModifyRobot()) {
      setError('Sie haben keine Berechtigung, Roboter zu verwalten');
      return;
    }
    setSelectedRobot(robot);
    setIsEditRobotModalOpen(true);
  };

  // Funktion zum Generieren einer öffentlichen Kalender-URL
  const generatePublicCalendarUrl = async () => {
    setCalendarLoading(true);
    setCalendarError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar/public`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Generieren der Kalender-URL');
      }
      
      const data = await response.json();
      setCalendarUrl(data.url);
      
      // Erfolgreiche Nachricht anzeigen
      setSnackbar({
        open: true,
        message: 'Kalender-URL erfolgreich generiert!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Fehler beim Generieren der Kalender-URL:', error);
      setCalendarError('Fehler beim Generieren der Kalender-URL');
      
      // Fehlermeldung anzeigen
      setSnackbar({
        open: true,
        message: 'Fehler beim Generieren der Kalender-URL',
        severity: 'error'
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  // Profil-Komponente
  const Profile: React.FC = () => {
    const { user, token } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
      open: false,
      message: '',
      severity: 'success'
    });

    const handleChangePassword = async (passwordData: { currentPassword: string, newPassword: string }) => {
      try {
        console.log('Ändere Passwort für Benutzer:', user?.username);
        
        const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(passwordData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Fehler beim Ändern des Passworts');
        }
        
        setAlertInfo({
          open: true,
          message: 'Passwort erfolgreich geändert',
          severity: 'success'
        });
        
        setIsPasswordModalOpen(false);
      } catch (error: any) {
        console.error('Fehler beim Ändern des Passworts:', error);
        setAlertInfo({
          open: true,
          message: error.message || 'Fehler beim Ändern des Passworts',
          severity: 'error'
        });
      }
    };

    const handleCloseAlert = () => {
      setAlertInfo({ ...alertInfo, open: false });
    };

    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Mein Profil
          </Typography>
          
          <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={handleCloseAlert}>
            <Alert onClose={handleCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
              {alertInfo.message}
            </Alert>
          </Snackbar>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Benutzername:</Typography>
                <Typography variant="body1">{user?.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Name:</Typography>
                <Typography variant="body1">{user?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">E-Mail:</Typography>
                <Typography variant="body1">{user?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Rolle:</Typography>
                <Typography variant="body1">{user?.role === 'admin' ? 'Administrator' : 'Benutzer'}</Typography>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Passwort ändern
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
        
        <PasswordChangeModal 
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onSave={handleChangePassword}
        />
      </Container>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Box sx={{ width: '100%', mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Kalender" />
            <Tab label="Roboter" />
            <Tab label="Reservierungen" />
            <Tab label="Kalender-Abo" />
            <Tab label="Profil" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2">
              Kalender
            </Typography>
          </Box>
          <ReservationCalendar
            robots={robots}
            reservations={reservations}
            onReserve={handleCalendarReserve}
            onEventClick={handleEventClick}
            onEventContextMenu={handleEventContextMenu}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2">
              Verfügbare Roboter
            </Typography>
          </Box>
          <RobotList
            robots={robots}
            onReserve={handleReserve}
            onEdit={handleEdit}
            onDelete={handleDeleteRobot}
            canModify={canModifyRobot()}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ReservationList
            reservations={reservations}
            onDelete={handleDeleteReservation}
            onEdit={handleEditReservation}
            canModify={canModifyRobot()}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2">
              Kalender-Abo
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
              Hier können Sie einen öffentlichen Kalender-Link generieren, um alle Reservierungen in Ihrer Kalender-App anzuzeigen.
              Der Link ist 30 Tage gültig und kann mit anderen Personen geteilt werden.
            </Typography>
          </Box>
          <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={generatePublicCalendarUrl}
              disabled={calendarLoading}
              startIcon={<CalendarMonthIcon />}
            >
              {calendarLoading ? 'Generiere...' : 'Kalender-URL generieren'}
            </Button>
            {calendarUrl && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Öffentliche Kalender-URL:
                </Typography>
                <Link href={calendarUrl} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>
                  {calendarUrl}
                </Link>
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Diese URL kann in Kalender-Anwendungen wie Google Calendar, Apple Kalender oder Outlook abonniert werden.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={() => {
                    navigator.clipboard.writeText(calendarUrl);
                    setSnackbar({
                      open: true,
                      message: 'URL in die Zwischenablage kopiert!',
                      severity: 'success'
                    });
                  }}
                  startIcon={<ContentCopyIcon />}
                >
                  URL kopieren
                </Button>
              </Box>
            )}
            {calendarError && (
              <Typography variant="body1" color="error.main" sx={{ mt: 2 }}>
                Fehler: {calendarError}
              </Typography>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Profile />
        </TabPanel>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Kontextmenü für Kalendereinträge */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          if (contextMenu?.event) {
            const reservation = reservations.find(r => r._id === contextMenu.event?.id);
            if (reservation) {
              setSelectedReservation(reservation);
              setIsReservationModalOpen(true);
            }
          }
          handleContextMenuClose();
        }}>
          Details anzeigen
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu?.event) {
            const reservation = reservations.find(r => r._id === contextMenu.event?.id);
            if (reservation && canEditReservation(reservation)) {
              setSelectedReservation(reservation);
              setIsReservationModalOpen(true);
            } else {
              setSnackbar({
                open: true,
                message: 'Sie haben keine Berechtigung, diese Reservierung zu bearbeiten',
                severity: 'warning'
              });
            }
          }
          handleContextMenuClose();
        }}>
          Bearbeiten
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu?.event) {
            const reservation = reservations.find(r => r._id === contextMenu.event?.id);
            if (reservation && canEditReservation(reservation)) {
              handleDeleteClick(contextMenu.event.id);
            } else {
              setSnackbar({
                open: true,
                message: 'Sie haben keine Berechtigung, diese Reservierung zu löschen',
                severity: 'warning'
              });
            }
          }
          handleContextMenuClose();
        }}>
          Löschen
        </MenuItem>
      </Menu>

      <ReservationModal
        open={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setSelectedReservation(null);
          setSelectedRobot(null);
          setSelectedStartDate(undefined);
          setSelectedEndDate(undefined);
        }}
        onCreate={async (data) => {
          try {
            await handleCreateReservation(data);
            setIsReservationModalOpen(false);
          } catch (error: any) {
            console.error('Fehler beim Erstellen:', error);
          }
        }}
        onEdit={async (id, data) => {
          try {
            await handleUpdateReservation(id, data);
            setIsReservationModalOpen(false);
          } catch (error: any) {
            console.error('Fehler beim Aktualisieren:', error);
          }
        }}
        selectedReservation={selectedReservation}
        availableRobots={robots}
        initialStartDate={selectedStartDate}
        initialEndDate={selectedEndDate}
      />

      <AddRobotModal
        open={isAddRobotModalOpen}
        onClose={() => setIsAddRobotModalOpen(false)}
        onAdd={handleAddRobotComplete}
        token={token}
      />

      <EditRobotModal
        open={isEditRobotModalOpen}
        onClose={() => setIsEditRobotModalOpen(false)}
        onSave={handleEditRobotComplete}
        robot={selectedRobot}
      />
    </Container>
  );
};

export default DashboardView;
