import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import RobotIcon from '@mui/icons-material/SmartToy';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <AppBar position="static">
      <Container>
        <Toolbar disableGutters>
          <RobotIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Roboter-Verwaltung
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/dashboard"
            >
              Dashboard
            </Button>
            {user.role === 'admin' && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/admin"
              >
                Admin
              </Button>
            )}
            <Button
              color="inherit"
              onClick={handleLogout}
            >
              Abmelden
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
