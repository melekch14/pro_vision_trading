export interface Customer {
  id: number;
  codee: string;
  raison_social: string;
  email: string;
  responsable: string;
  tel: string;
  status: string;
  adresse: string;
  password: string;
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