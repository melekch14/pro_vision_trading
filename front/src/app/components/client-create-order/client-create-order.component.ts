import { Component } from '@angular/core';

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

  produits = [
    'Verre Simple',
    'Verre Progressif',
    'Verre Bifocal',
    'Verre Sport',
    'Verre Enfant'
  ];

  selectedFileName: string = '';

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

  ngOnInit() {
    // Optionally, set default values
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
    } else {
      this.selectedFileName = '';
    }
  }

  submitOrder() {
    // TODO: Implement order submission logic
    alert('Commande soumise!');
  }
} 