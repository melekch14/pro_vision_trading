export interface Product {
  id: number;
  code: string;
  libelle: string;
  DC?: string;
  sphere?: number;
  cylinder?: number;
  reference?: string;
  subfamily_id?: number;
  stock_quantity: number;
  price: number;
} 