import { Robot } from './Robot';
import { User } from './User';

export interface Reservation {
  _id: string;
  robotId: Robot;
  userId: User;
  eventName: string;
  location: string;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}
