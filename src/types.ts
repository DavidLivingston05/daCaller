export interface Contact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  status: 'Pending' | 'Answered' | 'Missed';
  group?: string;
  notes?: string;
  lastCalledAt?: number;
  callCount?: number;
}

export interface CallRecord {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  outcome: 'Answered' | 'Missed';
  timestamp: number;
  duration?: number;
}

export type SortOption = 'Status' | 'Name' | 'Recent';
export type TabOption = 'All' | 'Pending' | 'Answered' | 'Missed';
export type ViewMode = 'list' | 'rapid' | 'stats';
