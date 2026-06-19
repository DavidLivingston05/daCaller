export interface Contact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  status: 'Pending' | 'Answered' | 'Missed';
}
