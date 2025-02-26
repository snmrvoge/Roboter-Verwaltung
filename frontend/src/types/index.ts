export interface Robot {
  _id: string;
  name: string;
  type: "humanoid" | "dog";
  status: string;
  homebase: string;
}

export interface Reservation {
  _id: string;
  robotId: Robot;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  eventName: string;
  location: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}
