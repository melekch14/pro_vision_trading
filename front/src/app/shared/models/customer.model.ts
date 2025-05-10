export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  joinDate: Date;
  totalOrders: number;
  totalSpent: number;
  status: CustomerStatus;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export enum CustomerStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  New = 'New'
} 