import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningIcon from '@mui/icons-material/Warning';
import { Robot } from '../types';

interface RobotListProps {
  robots: Robot[];
  onReserve: (robot: Robot) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => void;
  canModify?: boolean;
}

export const RobotList: React.FC<RobotListProps> = ({
  robots,
  onReserve,
  onEdit,
  onDelete,
  canModify = false
}) => {
  return (
    <List>
      {robots.map((robot) => (
        <ListItem
          key={robot._id}
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
                  {robot.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onReserve(robot)}
                    color="primary"
                    title="Reservieren"
                  >
                    <CalendarTodayIcon />
                  </IconButton>
                  {canModify && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(robot)}
                        color="primary"
                        title="Bearbeiten"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(robot._id)}
                        color="error"
                        title="Löschen"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Typ: {robot.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Standort: {robot.homebase}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={robot.status === 'available' ? 'Verfügbar' : robot.status === 'maintenance' ? 'In Wartung' : 'Reserviert'}
                    size="small"
                    color={robot.status === 'available' ? 'success' : robot.status === 'maintenance' ? 'warning' : 'primary'}
                    icon={robot.status === 'maintenance' ? <WarningIcon /> : undefined}
                  />
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};
