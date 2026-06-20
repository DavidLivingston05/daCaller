export interface Contact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  status: 'Pending' | 'Answered' | 'Missed' | 'Wrong Number';
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
  outcome: 'Answered' | 'Missed' | 'Wrong Number';
  timestamp: number;
  duration?: number;
}

export type SortOption = 'Status' | 'Name' | 'Recent';
export type TabOption = 'All' | 'Pending' | 'Answered' | 'Missed' | 'Wrong Number';
export type ViewMode = 'list' | 'rapid' | 'stats';
