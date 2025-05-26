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