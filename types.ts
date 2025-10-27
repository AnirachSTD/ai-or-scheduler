export type View = 'dashboard' | 'schedule' | 'analytics' | 'audit';

export interface KPI {
  name: string;
  value: string;
  target: string;
  delta: number;
  deltaType: 'increase' | 'decrease';
  data: { name: string; current: number; baseline: number }[];
}

export interface Surgeon {
  id: string;
  // FIX: The type should be string, not the literal "string".
  name: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface Case {
  id: string;
  patientId: string;
  procedure: string;
  surgeon: string;
  room: string;
  startTime: string; // "HH:mm"
  surgeonEstimateMinutes: number;
  aiP50Minutes: number;
  aiP90Minutes: number;
  turnoverMinutes: number;
  priority: 'Elective' | 'Urgent' | 'Emergent';
  risk: 'Low' | 'Medium' | 'High';
  conflicts: string[];
}