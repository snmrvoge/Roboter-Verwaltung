export interface Robot {
  _id: string;
  name: string;
  robotType: 'humanoid' | 'dog';
  status: 'available' | 'reserved' | 'maintenance';
  homebase: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Reservation {
  _id: string;
  robotId: Robot;
  userId: User;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
}
