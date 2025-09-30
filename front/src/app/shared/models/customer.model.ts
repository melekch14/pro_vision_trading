export interface Customer {
  id: number;
  codee: string;
  raison_social: string;
  email: string;
  responsable: string;
  tel: string;
  fax?: string;
  status: string;
  adresse: string;
  ville?: string;
  password: string;
  rccm: string;
  ninea: string;
  code_douane: string;
  risque?: string;
  password_updated?: number;
  email_updated?: boolean;
  imported_from_excel?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export enum CustomerStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
} 