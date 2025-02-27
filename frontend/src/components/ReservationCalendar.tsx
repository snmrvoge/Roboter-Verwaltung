import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  Chip
} from '@mui/material';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format as formatDate } from 'date-fns';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { de } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Robot, Reservation } from '../types';

const locales = {
  'de-DE': de,
};

const localizer = dateFnsLocalizer({
  format: formatDate,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Exportiere die CalendarEvent-Schnittstelle für die Verwendung in anderen Komponenten
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  location?: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface ReservationCalendarProps {
  robots: Robot[];
  reservations: Reservation[];
  onReserve: (robot: Robot, start: Date, end: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventContextMenu?: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  robots,
  reservations,
  onReserve,
  onEventClick,
  onEventContextMenu
}) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  
  const events: CalendarEvent[] = reservations.map(reservation => ({
    id: reservation._id,
    title: reservation.eventName || reservation.purpose,
    start: new Date(reservation.startDate),
    end: new Date(reservation.endDate),
    resource: typeof reservation.robotId === 'string' 
      ? robots.find(r => r._id === reservation.robotId) 
      : reservation.robotId,
    location: reservation.location,
    contactPerson: reservation.contactPerson,
  }));

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log('Zeitraum ausgewählt:', slotInfo);
    
    // Prüfe, ob Roboter für diesen Zeitraum verfügbar sind
    const availableRobots = robots.filter(robot => {
      // Prüfe, ob der Roboter im gewählten Zeitraum bereits reserviert ist
      const isReserved = reservations.some(reservation => {
        const reservationStart = new Date(reservation.startDate);
        const reservationEnd = new Date(reservation.endDate);
        const robotId = typeof reservation.robotId === 'string' ? reservation.robotId : reservation.robotId._id;
        return (
          robotId === robot._id &&
          ((slotInfo.start >= reservationStart && slotInfo.start < reservationEnd) ||
            (slotInfo.end > reservationStart && slotInfo.end <= reservationEnd) ||
            (slotInfo.start <= reservationStart && slotInfo.end >= reservationEnd))
        );
      });
      
      // Prüfe, ob der Roboter in Wartung ist
      const isInMaintenance = robot.status === 'maintenance';
      
      // Roboter ist verfügbar, wenn er nicht reserviert und nicht in Wartung ist
      return !isReserved && !isInMaintenance;
    });

    if (availableRobots.length > 0) {
      setSelectedRobot(availableRobots[0]._id);
      onReserve(availableRobots[0], slotInfo.start, slotInfo.end);
    } else {
      console.log('Keine verfügbaren Roboter für diesen Zeitraum gefunden');
      // Öffne trotzdem das Modal, aber ohne vorausgewählten Roboter
      // Der Benutzer kann dann im Modal einen Zeitraum wählen, für den Roboter verfügbar sind
      onReserve({} as Robot, slotInfo.start, slotInfo.end);
    }
  };
  
  const handleViewChange = (newView: View) => {
    console.log('Ansicht geändert zu:', newView);
    setView(newView);
  };

  const handleNavigate = (newDate: Date, view: View, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => {
    setDate(newDate);
  };

  const handlePrevious = () => {
    const newDate = new Date(date);
    
    if (view === 'month') {
      newDate.setMonth(date.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(date.getDate() - 1);
    }
    
    setDate(newDate);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleNext = () => {
    const newDate = new Date(date);
    
    if (view === 'month') {
      newDate.setMonth(date.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(date.getDate() + 1);
    }
    
    setDate(newDate);
  };

  const eventPropGetter = (event: CalendarEvent) => {
    const reservation = reservations.find(r => r._id === event.id);
    if (!reservation) return {};
    
    const robotId = typeof reservation.robotId === 'string' ? reservation.robotId : reservation.robotId._id;
    const robot = robots.find(r => r._id === robotId);
    
    return {
      style: {
        backgroundColor: robot?.color || '#3174ad',
      },
    };
  };

  const slotPropGetter = (date: Date) => {
    // Für Monats- und Wochenansicht ist date ein einzelnes Datum
    // Wir müssen den Zeitraum für diesen Slot berechnen
    const slotStart = new Date(date);
    const slotEnd = new Date(date);
    
    // Für die Tagesansicht setzen wir den Slot auf den ganzen Tag
    slotEnd.setHours(slotStart.getHours() + 1);
    
    // Finde alle Reservierungen, die sich mit diesem Zeitslot überschneiden
    const robot = robots.find(r => r._id === selectedRobot);
    if (!robot) return {};
    
    const conflictingReservations = reservations.filter(reservation => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      // Prüfe, ob die Reservierung den gleichen Roboter betrifft und sich zeitlich überschneidet
      const robotId = typeof reservation.robotId === 'string' ? reservation.robotId : reservation.robotId._id;
      return (
        robotId === robot._id &&
        ((slotStart >= reservationStart && slotStart < reservationEnd) ||
          (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
          (slotStart <= reservationStart && slotEnd >= reservationEnd))
      );
    });
    
    // Prüfe, ob der Roboter in Wartung ist
    const isInMaintenance = robot.status === 'maintenance';
    
    return {
      style: {
        backgroundColor: conflictingReservations.length > 0 ? '#f0ad4e' : '#fff',
      },
    };
  };

  const CustomToolbar = () => {
    // Sichere Berechnung des Enddatums für die Wochenansicht
    const getWeekEndDate = (startDate: Date) => {
      try {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // 6 Tage nach dem Startdatum
        return endDate;
      } catch (error) {
        console.error('Fehler bei der Datumsberechnung:', error);
        return new Date(); // Fallback auf aktuelles Datum
      }
    };

    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" component="h2">
            {view === 'month' && formatDate(date, 'MMMM yyyy', { locale: de })}
            {view === 'week' && (() => {
              try {
                const endDate = getWeekEndDate(date);
                return `${formatDate(date, 'd. MMMM', { locale: de })} - ${formatDate(endDate, 'd. MMMM yyyy', { locale: de })}`;
              } catch (error) {
                console.error('Fehler beim Formatieren des Wochendatums:', error);
                return 'Wochenansicht';
              }
            })()}
            {view === 'day' && formatDate(date, 'EEEE, d. MMMM yyyy', { locale: de })}
          </Typography>
        </Box>
        <Box>
          <ButtonGroup variant="outlined" size="small" sx={{ mr: 2 }}>
            <Button onClick={handlePrevious}>Zurück</Button>
            <Button onClick={handleToday}>Heute</Button>
            <Button onClick={handleNext}>Vor</Button>
          </ButtonGroup>
          <ButtonGroup variant="outlined" size="small">
            <Button 
              onClick={() => handleViewChange('day')}
              variant={view === 'day' ? 'contained' : 'outlined'}
            >
              Tag
            </Button>
            <Button 
              onClick={() => handleViewChange('week')}
              variant={view === 'week' ? 'contained' : 'outlined'}
            >
              Woche
            </Button>
            <Button 
              onClick={() => handleViewChange('month')}
              variant={view === 'month' ? 'contained' : 'outlined'}
            >
              Monat
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
      <CustomToolbar />
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onNavigate={(newDate, view, action) => handleNavigate(newDate, view, action)}
        date={date}
        view={view}
        onView={handleViewChange}
        views={['day', 'week', 'month']}
        defaultView="month"
        toolbar={false}
        popup={true}
        eventPropGetter={eventPropGetter}
        slotPropGetter={slotPropGetter}
        onSelectEvent={(event) => onEventClick && onEventClick(event)}
        components={{
          event: (props) => {
            const { event } = props;
            const reservation = reservations.find(r => r._id === event.id);
            if (!reservation) return null;
            
            // Bestimme, ob robotId ein String oder ein Objekt ist
            const robotName = typeof reservation.robotId === 'string' 
              ? robots.find(r => r._id === reservation.robotId)?.name || 'Unbekannter Roboter'
              : (reservation.robotId as Robot).name;
              
            // Bestimme, ob der Roboter in Wartung ist
            const robotStatus = typeof reservation.robotId === 'string'
              ? robots.find(r => r._id === reservation.robotId)?.status
              : (reservation.robotId as Robot).status;
            
            const isInMaintenance = robotStatus === 'maintenance';
            
            return (
              <Box 
                sx={{ p: 1 }}
                onContextMenu={(e) => onEventContextMenu && onEventContextMenu(event, e)}
              >
                <Typography variant="body2" noWrap>
                  {event.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Roboter: {robotName}
                  </Typography>
                  {isInMaintenance && (
                    <Chip
                      label="Wartung"
                      size="small"
                      color="warning"
                      sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                    />
                  )}
                </Box>
              </Box>
            );
          },
        }}
        formats={{
          dayHeaderFormat: (date: Date) => formatDate(date, 'EEEE, d. MMMM yyyy', { locale: de }),
          dayFormat: (date: Date) => formatDate(date, 'EEEE, d. MMMM yyyy', { locale: de }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) => 
            `${formatDate(start, 'd. MMMM', { locale: de })} - ${formatDate(end, 'd. MMMM yyyy', { locale: de })}`,
          monthHeaderFormat: (date: Date) => formatDate(date, 'MMMM yyyy', { locale: de }),
          weekdayFormat: (date: Date) => formatDate(date, 'EEE', { locale: de }),
        }}
        messages={{
          next: "Vor",
          previous: "Zurück",
          today: "Heute",
          month: "Monat",
          week: "Woche",
          day: "Tag",
          agenda: "Agenda",
          date: "Datum",
          time: "Zeit",
          event: "Ereignis",
          noEventsInRange: "Keine Reservierungen in diesem Zeitraum",
          allDay: "Ganztägig",
          work_week: "Arbeitswoche",
          yesterday: "Gestern",
          tomorrow: "Morgen",
          showMore: (total: number) => `+ ${total} weitere`
        }}
        culture="de-DE"
      />
    </Paper>
  );
};
