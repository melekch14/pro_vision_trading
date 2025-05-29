import { Component } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-create-order',
  templateUrl: './client-create-order.component.html',
  styleUrls: ['./client-create-order.component.css'],
  standalone: false
})
export class ClientCreateOrderComponent {
  order = {
    od: { sphere: '', cylinder: '', axe: '', addition: '' },
    og: { sphere: '', cylinder: '', axe: '', addition: '' },
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    supplement: '',
    traitement: '',
    produit: ''
  };

  traitements = [
    'Antireflet',
    'Durci',
    'Photochromique',
    'Polarisant',
    'Blue Cut'
  ];

  produits: any[] = [];
  filteredProducts: any[] = [];

  selectedFileName: string = '';
  selectedFile: File | null = null;

  price: number = 0;
  shippingType: string = '';
  deliveryTime: string = '';

  // Example product prices
  productPrices: { [key: string]: number } = {
    'Verre Simple': 50,
    'Verre Progressif': 120,
    'Verre Bifocal': 90,
    'Verre Sport': 80,
    'Verre Enfant': 40
  };

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize with empty product list
    this.filteredProducts = [];
  }

  areAllCorrectionsFilled(): boolean {
    const { od, og } = this.order;
    return (
      od.sphere !== '' && od.cylinder !== '' && od.axe !== '' && od.addition !== '' &&
      og.sphere !== '' && og.cylinder !== '' && og.axe !== '' && og.addition !== ''
    );
  }

  onTraitementChange() {
    if (this.areAllCorrectionsFilled() && this.order.traitement) {
      // Get the values from OD (or OG if that's what we're using)
      const sphere = this.order.od.sphere;
      const cylinder = this.order.od.cylinder;

      // Only make API call if we have actual values
      if (sphere && cylinder) {
        this.orderService.getMatchingProducts(sphere, cylinder).subscribe({
          next: (products) => {
            this.filteredProducts = products;
            console.log('Matching products:', products);
          },
          error: (error) => {
            console.error('Error fetching matching products:', error);
            this.filteredProducts = [];
          }
        });
      }
    } else {
      // If not all corrections are filled or no traitement selected, show empty list
      this.filteredProducts = [];
    }
  }

  getProductDisplayName(product: any): string {
    return `${product.article_libelle} (${product.cylinder}) - ${product.sphere}`;
  }

  ngDoCheck() {
    // Update price when product changes
    if (this.order.produit && this.productPrices[this.order.produit]) {
      this.price = this.productPrices[this.order.produit];
    } else {
      this.price = 0;
    }
  }

  onShippingTypeChange() {
    if (this.shippingType === 'free') {
      this.deliveryTime = '7-10 jours ouvrables';
    } else if (this.shippingType === 'express') {
      this.deliveryTime = '24-48 heures';
    } else {
      this.deliveryTime = '';
    }
  }

  copyToOG() {
    this.order.og.sphere = this.order.od.sphere;
    this.order.og.cylinder = this.order.od.cylinder;
    this.order.og.axe = this.order.od.axe;
    this.order.og.addition = this.order.od.addition;
  }

  copyToOD() {
    this.order.od.sphere = this.order.og.sphere;
    this.order.od.cylinder = this.order.og.cylinder;
    this.order.od.axe = this.order.og.axe;
    this.order.od.addition = this.order.og.addition;
  }

  copyFieldToOG(field: 'sphere' | 'cylinder' | 'axe' | 'addition') {
    this.order.og[field] = this.order.od[field];
  }

  onSupplementChange() {
    // Reset file name if supplement changes
    if (this.order.supplement !== 'precal') {
      this.selectedFileName = '';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.selectedFile = file;
    } else {
      this.selectedFileName = '';
      this.selectedFile = null;
    }
  }

  async submitOrder() {
    try {
      // First create the order
      const orderResponse = await this.orderService.createOrder(this.order).toPromise();
      
      // If there's a file and it's a precal supplement, upload it
      if (this.selectedFile && this.order.supplement === 'precal') {
        const orderId = orderResponse._id; // Assuming the backend returns the order ID
        await this.orderService.uploadFile(this.selectedFile, orderId).toPromise();
      }

      alert('Commande soumise avec succès!');
      this.router.navigate(['/orders']); // Navigate to orders list or confirmation page
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Une erreur est survenue lors de la soumission de la commande.');
    }
  }
} 