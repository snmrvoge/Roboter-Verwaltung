export interface Robot {
  _id: string;
  name: string;
  description: string;
  model: string;
  status: string;
  color: string; // Hinzugefügt für die Kalenderansicht
}

export interface Reservation {
  _id: string;
  robotId: string;
  userId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: string;
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
