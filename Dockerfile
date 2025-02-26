FROM node:18-alpine as backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./

FROM node:18-alpine as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/frontend/build ./frontend/build

EXPOSE 3001

CMD ["node", "backend/test-reservations.js"]
