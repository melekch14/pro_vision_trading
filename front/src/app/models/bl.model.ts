export interface Bl {
  id: number;
  numero: string;
  date: string;
  code_tier: string;
  nom_raison_social: string;
  total_ttc: number;
  mode_paie: string;
  observation: string;
  user_create: string;
  totreg: number;
  deja_recu: number;
  reste: number;
  created_at: string;
  updated_at: string;
}

export interface BlStatistics {
  totalRecords: number;
  totalAmount: number;
  totalRemaining: number;
}

export interface BlImportResult {
  message: string;
  importedCount: number;
  totalRecords: number;
}

export interface BlSearchResult {
  success: boolean;
  data: Bl[];
  count: number;
}

