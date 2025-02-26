export interface Robot {
  _id: string;
  name: string;
  robotType: string;
  model: string;
  status: string;
  color: string; // Hinzugefügt für die Kalenderansicht
  homebase: string;
}

export interface Reservation {
  _id: string;
  robotId: string | Robot;
  userId: string | User;
  startDate: string;
  endDate: string;
  purpose: string;
  status: string;
  eventName: string;
  location: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface UserData {
  _id?: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}
