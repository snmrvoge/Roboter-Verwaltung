import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import { format } from 'date-fns';
import { Reservation, Robot } from '../types';

interface ReservationListProps {
  reservations: Reservation[];
  onDelete: (reservationId: string) => void;
  onEdit: (reservation: Reservation) => void;
  canModify: boolean;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  onDelete,
  onEdit,
  canModify
}) => {
  if (!reservations || reservations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Keine Reservierungen gefunden
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {reservations.map((reservation) => (
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
                  {reservation.eventName}
                </Typography>
                {canModify && (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(reservation)}
                      color="primary"
                      title="Bearbeiten"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(reservation._id)}
                      color="error"
                      title="Löschen"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            }
            secondary={
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Roboter: {typeof reservation.robotId === 'string' 
                      ? 'Unbekannter Roboter' 
                      : (reservation.robotId as any).name || 'Unbekannter Roboter'}
                  </Typography>
                  {typeof reservation.robotId !== 'string' && (reservation.robotId as any).status === 'maintenance' && (
                    <Chip
                      label="In Wartung"
                      color="warning"
                      size="small"
                      icon={<WarningIcon />}
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Benutzer: {typeof reservation.userId === 'object' && reservation.userId?.name ? reservation.userId.name : 'Unbekannter Benutzer'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  E-Mail: {typeof reservation.userId === 'object' && reservation.userId?.email ? reservation.userId.email : 'Keine E-Mail'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ort: {reservation.location || 'Kein Ort angegeben'}
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
      ))}
    </List>
  );
};
