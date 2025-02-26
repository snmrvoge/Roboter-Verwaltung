import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../context/AuthContext';
import { Robot, User } from '../types';
import { RobotList } from '../components/RobotList';
import { EditRobotModal } from '../components/EditRobotModal';
import { UserEditModal } from '../components/UserManagementModal';
import { API_BASE_URL } from '../config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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

const AdminView: React.FC = () => {
  const { token, user } = useAuth();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchRobots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/robots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Fehler beim Laden der Roboter');
      const data = await response.json();
      setRobots(data);
    } catch (err) {
      setError('Fehler beim Laden der Roboter');
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Lade Benutzer mit Token:', token);
      
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Benutzer');
      }
      
      const data = await response.json();
      console.log('Geladene Benutzer:', data);
      setUsers(data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      setAlertInfo({
        open: true,
        message: 'Fehler beim Laden der Benutzer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRobots();
    fetchUsers();
  }, [token]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddRobot = () => {
    setEditingRobot(null);
    setIsRobotModalOpen(true);
  };

  const handleEditRobot = (robot: Robot) => {
    setEditingRobot(robot);
    setIsRobotModalOpen(true);
  };

  const handleDeleteRobot = async (robotId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/robots/${robotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Roboters');
      }

      setRobots(robots.filter(robot => robot._id !== robotId));
    } catch (err) {
      setError('Fehler beim Löschen des Roboters');
      console.error(err);
    }
  };

  const handleRobotModalClose = () => {
    setIsRobotModalOpen(false);
    setEditingRobot(null);
  };

  const handleUserModalClose = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
    setIsNewUser(false);
  };

  const handleSaveRobot = async (robotData: Partial<Robot>) => {
    try {
      const isEditing = !!editingRobot;
      const url = isEditing 
        ? `${API_BASE_URL}/api/robots/${editingRobot._id}`
        : `${API_BASE_URL}/api/robots`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(robotData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Roboters');
      }

      const savedRobot = await response.json();

      if (isEditing) {
        setRobots(robots.map(robot => 
          robot._id === editingRobot._id ? savedRobot : robot
        ));
      } else {
        setRobots([...robots, savedRobot]);
      }

      handleRobotModalClose();
    } catch (err) {
      setError('Fehler beim Speichern des Roboters');
      console.error(err);
    }
  };

  const createUser = async (userData: any) => {
    try {
      setLoading(true);
      console.log('Erstelle neuen Benutzer:', userData);
      
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Erstellen des Benutzers');
      }
      
      const newUser = await response.json();
      console.log('Neuer Benutzer erstellt:', newUser);
      
      // Aktualisiere die Benutzerliste
      fetchUsers();
      setIsUserModalOpen(false);
      
      // Zeige Erfolgsmeldung
      setAlertInfo({
        open: true,
        message: `Benutzer ${newUser.username} erfolgreich erstellt`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      setAlertInfo({
        open: true,
        message: error.message || 'Fehler beim Erstellen des Benutzers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: any) => {
    try {
      setLoading(true);
      console.log('Aktualisiere Benutzer:', userData);
      
      if (!userData._id) {
        throw new Error('Benutzer-ID fehlt');
      }
      
      // Debug-Ausgabe
      console.log(`Sende Anfrage an: ${API_BASE_URL}/api/users/${userData._id}`);
      console.log('Mit Daten:', JSON.stringify({
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          name: userData.name,
          email: userData.email,
          role: userData.role
        })
      });
      
      // Debug-Ausgabe
      console.log('Antwort-Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fehler-Antwort:', errorData);
        throw new Error(errorData.message || 'Fehler beim Aktualisieren des Benutzers');
      }
      
      const updatedUser = await response.json();
      console.log('Benutzer aktualisiert:', updatedUser);
      
      // Aktualisiere die Benutzerliste
      fetchUsers();
      setIsUserModalOpen(false);
      
      // Zeige Erfolgsmeldung
      setAlertInfo({
        open: true,
        message: `Benutzer ${updatedUser.username} erfolgreich aktualisiert`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      setAlertInfo({
        open: true,
        message: error.message || 'Fehler beim Aktualisieren des Benutzers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (selectedUser && !isNewUser) {
        await updateUser({
          ...userData,
          _id: selectedUser._id
        });
      } else {
        await createUser(userData);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Benutzers:', error);
      throw error;
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsNewUser(false);
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsNewUser(true);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Benutzers');
      }

      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Fehler beim Löschen des Benutzers:', err);
      setError('Fehler beim Löschen des Benutzers');
    }
  };

  const handleReserveRobot = () => {
    // Diese Funktion wird in der Admin-Ansicht nicht benötigt,
    // aber wir müssen sie für die RobotList-Props bereitstellen
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin-Bereich
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Roboter-Verwaltung" id="admin-tab-0" aria-controls="admin-tabpanel-0" />
            <Tab label="Benutzer-Verwaltung" id="admin-tab-1" aria-controls="admin-tabpanel-1" />
          </Tabs>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Roboter-Verwaltung</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRobot}
          >
            Neuer Roboter
          </Button>
        </Box>
        
        <Paper sx={{ p: 2 }}>
          <RobotList
            robots={robots}
            onEdit={handleEditRobot}
            onDelete={handleDeleteRobot}
            onReserve={handleReserveRobot}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Benutzer-Verwaltung</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddUser}
          >
            Neuer Benutzer
          </Button>
        </Box>
        
        <Paper sx={{ p: 2 }}>
          {users.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
              Keine Benutzer gefunden
            </Typography>
          ) : (
            <List>
              {users.map((user) => (
                <ListItem key={user._id} divider>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {user.email}
                        </Typography>
                        {` — Rolle: ${user.role}`}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditUser(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteUser(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </TabPanel>

      <EditRobotModal
        open={isRobotModalOpen}
        onClose={handleRobotModalClose}
        onSave={handleSaveRobot}
        robot={editingRobot}
      />

      <UserEditModal
        open={isUserModalOpen}
        onClose={handleUserModalClose}
        onSave={handleSaveUser}
        user={selectedUser}
        isNewUser={isNewUser}
      />
    </Container>
  );
};

export default AdminView;
