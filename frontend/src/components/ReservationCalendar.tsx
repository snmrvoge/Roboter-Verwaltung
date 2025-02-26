import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup
} from '@mui/material';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format as formatDate } from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import deDE from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Robot, Reservation } from '../types';

const locales = {
  'de-DE': deDE,
};

const localizer = dateFnsLocalizer({
  format: formatDate,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: Robot;
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
  
  const events: CalendarEvent[] = reservations.map(reservation => ({
    id: reservation._id,
    title: `${reservation.eventName} - ${reservation.robotId?.name || 'Unbekannter Roboter'}`,
    start: new Date(reservation.startDate),
    end: new Date(reservation.endDate),
    resource: reservation.robotId,
    location: reservation.location,
    contactPerson: reservation.contactPerson
  }));

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log('Zeitraum ausgewählt:', slotInfo);
    
    // Prüfe, ob Roboter für diesen Zeitraum verfügbar sind
    const availableRobots = robots.filter(robot => {
      // Prüfe, ob der Roboter im gewählten Zeitraum bereits reserviert ist
      const isReserved = reservations.some(reservation => {
        const reservationStart = new Date(reservation.startDate);
        const reservationEnd = new Date(reservation.endDate);
        return (
          reservation.robotId._id === robot._id &&
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
    const isMaintenance = event.resource?.status === 'maintenance';
    
    return {
      style: {
        backgroundColor: isMaintenance ? '#f0ad4e' : (event.resource?.color || '#3174ad'),
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: isMaintenance ? '2px dashed #d9534f' : '0px',
        display: 'block',
        fontWeight: isMaintenance ? 'bold' : 'normal'
      }
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
            {view === 'month' && formatDate(date, 'MMMM yyyy', { locale: deDE })}
            {view === 'week' && (() => {
              try {
                const endDate = getWeekEndDate(date);
                return `${formatDate(date, 'd. MMMM', { locale: deDE })} - ${formatDate(endDate, 'd. MMMM yyyy', { locale: deDE })}`;
              } catch (error) {
                console.error('Fehler beim Formatieren des Wochendatums:', error);
                return 'Wochenansicht';
              }
            })()}
            {view === 'day' && formatDate(date, 'EEEE, d. MMMM yyyy', { locale: deDE })}
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
        onSelectEvent={(event) => onEventClick && onEventClick(event)}
        components={{
          event: (props) => {
            const { event } = props;
            return (
              <div
                onContextMenu={(e) => onEventContextMenu && onEventContextMenu(event, e)}
                style={{ height: '100%', width: '100%' }}
              >
                {props.title}
              </div>
            );
          }
        }}
        formats={{
          dayHeaderFormat: (date: Date) => formatDate(date, 'EEEE, d. MMMM yyyy', { locale: deDE }),
          dayFormat: (date: Date) => formatDate(date, 'EEEE, d. MMMM yyyy', { locale: deDE }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) => 
            `${formatDate(start, 'd. MMMM', { locale: deDE })} - ${formatDate(end, 'd. MMMM yyyy', { locale: deDE })}`,
          monthHeaderFormat: (date: Date) => formatDate(date, 'MMMM yyyy', { locale: deDE }),
          weekdayFormat: (date: Date) => formatDate(date, 'EEE', { locale: deDE }),
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
