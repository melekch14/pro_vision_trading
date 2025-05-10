export interface Report {
  id: number;
  name: string;
  category: string;
  lastRun: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
  format: 'pdf' | 'excel' | 'csv' | 'dashboard';
} 