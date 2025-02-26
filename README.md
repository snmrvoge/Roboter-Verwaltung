# Roboter-Verwaltung

Ein System zur Verwaltung von Robotern und deren Reservierungen.

## Funktionen

- Verwaltung von Robotern (Hinzufügen, Bearbeiten, Löschen)
- Reservierungssystem für Roboter mit Kalenderansicht
- Rechtsklick-Kontextmenü für schnellen Zugriff auf Reservierungen
- Öffentlicher Kalender-Feed für Reservierungen (iCalendar-Format)
- Benutzerauthentifizierung und Rollenverwaltung
- Responsive Benutzeroberfläche mit Material-UI

## Technologien

### Frontend
- React.js
- TypeScript
- Material-UI
- React Big Calendar
- Axios für API-Anfragen

### Backend
- Node.js
- Express.js
- JWT für Authentifizierung
- iCal-Generator für Kalender-Feeds

## Installation

### Backend
```bash
cd backend
npm install
node test-reservations.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Nutzung

1. Melden Sie sich mit Ihren Zugangsdaten an
2. Verwalten Sie Roboter im "Roboter"-Tab
3. Erstellen und verwalten Sie Reservierungen im "Reservierungen"-Tab
4. Nutzen Sie den Kalender für eine Übersicht aller Reservierungen
5. Generieren Sie einen öffentlichen Kalender-Link im "Kalender-Abo"-Tab

## Kalender-Abo

Die Anwendung bietet die Möglichkeit, einen öffentlichen Kalender-Feed zu generieren, der in gängigen Kalender-Anwendungen abonniert werden kann:

1. Navigieren Sie zum "Kalender-Abo"-Tab
2. Klicken Sie auf "Kalender-URL generieren"
3. Kopieren Sie die generierte URL
4. Fügen Sie diese URL in Ihrer Kalender-Anwendung als Abonnement hinzu

## Lizenz

MIT
