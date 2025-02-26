import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Reservation } from '../types';

interface RobotCalendarProps {
  reservations: Reservation[];
}

const RobotCalendar: React.FC<RobotCalendarProps> = ({ reservations }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const getDayReservations = (date: Date) => {
    return reservations.filter(reservation => {
      const start = new Date(reservation.startDate);
      const end = new Date(reservation.endDate);
      const current = new Date(date);
      
      // Setze die Zeiten für den Vergleich
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      current.setHours(0, 0, 0, 0);

      return current >= start && current <= end;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // Füge leere Tage für den Monatsbeginn hinzu
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
      days.push(null);
    }
    
    // Füge die Tage des Monats hinzu
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const currentReservations = getDayReservations(selectedDate);
  const days = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isSelectedDay = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const hasReservations = (date: Date | null) => {
    if (!date) return false;
    return getDayReservations(date).length > 0;
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <IconButton onClick={handlePrevMonth}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6">
                {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </Typography>
              <IconButton onClick={handleNextMonth}>
                <ChevronRightIcon />
              </IconButton>
            </Stack>
            <Grid container spacing={1}>
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <Grid item xs={1.7} key={day}>
                  <Typography align="center" sx={{ fontWeight: 'bold' }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
              {days.map((date, index) => (
                <Grid item xs={1.7} key={index}>
                  {date && (
                    <Box
                      onClick={() => setSelectedDate(date)}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: isSelectedDay(date) ? 'primary.main' : hasReservations(date) ? 'primary.light' : 'transparent',
                        color: isSelectedDay(date) ? 'white' : 'inherit',
                        '&:hover': {
                          bgcolor: isSelectedDay(date) ? 'primary.dark' : 'primary.light',
                          color: isSelectedDay(date) ? 'white' : 'inherit',
                        },
                      }}
                    >
                      <Typography align="center">
                        {date.getDate()}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Reservierungen für {formatDate(selectedDate)}
          </Typography>
          {currentReservations.length === 0 ? (
            <Typography color="text.secondary">
              Keine Reservierungen an diesem Tag
            </Typography>
          ) : (
            currentReservations.map(reservation => (
              <Box
                key={reservation._id}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  {reservation.robotId.name} - {reservation.eventName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ort: {reservation.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reserviert von: {reservation.userId.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zeit: {formatTime(new Date(reservation.startDate))} - {formatTime(new Date(reservation.endDate))}
                </Typography>
              </Box>
            ))
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RobotCalendar;
