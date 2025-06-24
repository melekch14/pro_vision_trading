import { Component, OnDestroy } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-create-order',
  templateUrl: './client-create-order.component.html',
  styleUrls: ['./client-create-order.component.css'],
  standalone: false
})
export class ClientCreateOrderComponent implements OnDestroy {
  order = {
    od: { sphere: '', cylinder: '', axe: '', addition: '' },
    og: { sphere: '', cylinder: '', axe: '', addition: '' },
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    typeCommande: '',
    origineArticle: '',
    typeCorrection: '',
    produit: '',
    produit2: ''
  };

  typeCommandes = [
    { value: 'precal', label: 'Précal', description: 'Calcul de précision' },
    { value: 'non_precal', label: 'Non Précal', description: 'Configuration standard' }
  ];

  origineArticles = [
    { value: 'stock', label: 'Stock' },
    { value: 'fabrication', label: 'Fabrication' }
  ];

  typeCorrections = [
    { value: 'loin', label: 'Loin' },
    { value: 'pres', label: 'Près' },
    { value: 'loin_pres', label: 'Loin-Près' }
  ];

  produits: any[] = [];
  filteredProducts: any[] = [];
  filteredProducts2: any[] = [];
  selectedProduct: any = null;
  selectedProduct2: any = null;
  selectedArticle: any = null;
  selectedArticle2: any = null;

  selectedFileName: string = '';
  selectedFile: File | null = null;

  price: number = 0;
  price2: number = 0;
  totalPrice: number = 0;
  shippingType: string = '';
  deliveryTime: string = '';

  needsSecondProduct: boolean = false;

  errors = {
    od: { axe: false, addition: false },
    og: { axe: false, addition: false },
    phone: false,
    email: false,
    step3Disabled: true,
    step4Disabled: true,
    step5Disabled: true,
    step6Disabled: true,
    step6bDisabled: true,
    formInvalid: false
  };

  private validationTimeout: any;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.filteredProducts = [];
    this.filteredProducts2 = [];
    this.updateStepEnabling();
    this.updateFormValidity();
    this.checkCorrectionsForStep3();
  }

  validateAxeAndAddition() {
    this.errors.od.axe = this.isNegative(this.order.od.axe);
    this.errors.od.addition = this.isNegative(this.order.od.addition);
    this.errors.og.axe = this.isNegative(this.order.og.axe);
    this.errors.og.addition = this.isNegative(this.order.og.addition);
    
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
    this.updateFormValidity();
  }

  isNegative(value: any): boolean {
    if (value === '' || value === null || value === undefined) return false;
    return !isNaN(value) && parseFloat(value) < 0;
  }

  checkIfValuesAreDifferent() {
    const od = this.order.od;
    const og = this.order.og;
    
    const wasDifferent = this.needsSecondProduct;
    this.needsSecondProduct = (
      od.sphere !== og.sphere ||
      od.cylinder !== og.cylinder ||
      od.axe !== og.axe ||
      od.addition !== og.addition
    );
    
    // If values are the same, clear second product selection
    if (!this.needsSecondProduct) {
      this.order.produit2 = '';
      this.selectedProduct2 = null;
      this.selectedArticle2 = null;
      this.price2 = 0;
      this.filteredProducts2 = [];
    } else if (!wasDifferent && this.needsSecondProduct) {
      // If values just became different, trigger filtering for OG
      this.filterProductsForOG();
    }
    
    this.updateStepEnabling();
    this.updateTotalPrice();
    this.updateFormValidity();
  }

  validatePhoneSenegal(): boolean {
    const phone = this.order.phone.replace(/\D/g, '');
    const senegalPattern = /^(7[05678]\d{7})$/;
    this.errors.phone = !senegalPattern.test(phone);
    this.updateFormValidity();
    return !this.errors.phone;
  }

  validateEmail(): boolean {
    const email = this.order.email || '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.errors.email = !emailPattern.test(email);
    this.updateFormValidity();
    return !this.errors.email;
  }

  // Debounced validation for real-time input validation
  validateInputField(field: 'phone' | 'email') {
    clearTimeout(this.validationTimeout);
    this.validationTimeout = setTimeout(() => {
      if (field === 'phone') {
        this.validatePhoneSenegal();
      } else if (field === 'email') {
        this.validateEmail();
      }
    }, 300); // 300ms delay
  }

  updateStepEnabling() {
    this.errors.step3Disabled = !this.areAllCorrectionsFilled();
    this.errors.step4Disabled = !this.order.typeCommande;
    this.errors.step5Disabled = !this.order.typeCorrection;
    this.errors.step6Disabled = !this.order.origineArticle;
    this.errors.step6bDisabled = !this.order.produit || !this.needsSecondProduct;
  }

  onTypeCommandeChange() {
    if (this.order.typeCommande !== 'precal') {
      this.selectedFileName = '';
      this.selectedFile = null;
    }
    
    // Reset all fields below Type de commande
    this.order.typeCorrection = '';
    this.order.origineArticle = '';
    this.order.produit = '';
    this.order.produit2 = '';
    
    // Reset product selections and prices
    this.selectedProduct = null;
    this.selectedProduct2 = null;
    this.selectedArticle = null;
    this.selectedArticle2 = null;
    this.price = 0;
    this.price2 = 0;
    this.totalPrice = 0;
    
    // Reset filtered products
    this.filteredProducts = [];
    this.filteredProducts2 = [];
    
    // Reset shipping and delivery
    this.shippingType = '';
    this.deliveryTime = '';
    
    this.updateStepEnabling();
  }

  onTypeCorrectionChange() {
    this.updateStepEnabling();
    // Filtering is now only handled in onOrigineArticleChange
  }

  onOrigineArticleChange() {
    this.updateStepEnabling();
    if (this.order.origineArticle === 'fabrication') {
      // Get all fabrication products without filtering by corrections
      this.orderService.getFabricationProducts().subscribe({
        next: (products) => {
          this.filteredProducts = products;
          if (this.needsSecondProduct) {
            this.filteredProducts2 = products;
          }
        },
        error: (error) => {
          console.error('Error fetching fabrication products:', error);
          this.filteredProducts = [];
          this.filteredProducts2 = [];
        }
      });
    } else if (this.order.origineArticle === 'stock') {
      // Only filter if all corrections are filled and typeCorrection is selected
      if (this.areAllCorrectionsFilled() && this.order.typeCorrection) {
        const { sphere, cylinder, addition } = this.order.od;
        switch (this.order.typeCorrection) {
          case 'loin':
            this.filterProductsBySphereAndCylinder(sphere, cylinder);
            break;
          case 'pres':
            const spherePlusAddition = parseFloat(sphere) + parseFloat(addition);
            this.filterProductsBySphereAndCylinder(spherePlusAddition.toString(), cylinder);
            break;
          case 'loin_pres':
            this.filterProductsBySphereAndAddition(sphere, addition);
            break;
        }
        // Also filter for OG if needed
        if (this.needsSecondProduct) {
          this.filterProductsForOG();
        }
      } else {
        this.filteredProducts = [];
        this.filteredProducts2 = [];
      }
    } else {
      this.filteredProducts = [];
      this.filteredProducts2 = [];
    }
    // Update prices for both products when origineArticle changes
    this.updatePrice();
    this.updatePrice2();
  }

  filterProductsBySphereAndCylinder(sphere: string, cylinder: string) {
    if (sphere && cylinder) {
      this.orderService.getMatchingProducts(sphere, cylinder).subscribe({
        next: (products) => {
          this.filteredProducts = this.filterByOrigineArticle(products);
        },
        error: (error) => {
          console.error('Error fetching matching products:', error);
          this.filteredProducts = [];
        }
      });
    }
  }

  filterProductsBySphereAndAddition(sphere: string, addition: string) {
    if (sphere && addition) {
      this.orderService.getMatchingProductsBySphereAndAddition(sphere, addition).subscribe({
        next: (products) => {
          this.filteredProducts = this.filterByOrigineArticle(products);
        },
        error: (error) => {
          console.error('Error fetching matching products:', error);
          this.filteredProducts = [];
        }
      });
    }
  }

  filterProducts2BySphereAndCylinder(sphere: string, cylinder: string) {
    if (sphere && cylinder) {
      this.orderService.getMatchingProducts(sphere, cylinder).subscribe({
        next: (products) => {
          this.filteredProducts2 = this.filterByOrigineArticle(products);
        },
        error: (error) => {
          console.error('Error fetching matching products for OG:', error);
          this.filteredProducts2 = [];
        }
      });
    }
  }

  filterProducts2BySphereAndAddition(sphere: string, addition: string) {
    if (sphere && addition) {
      this.orderService.getMatchingProductsBySphereAndAddition(sphere, addition).subscribe({
        next: (products) => {
          this.filteredProducts2 = this.filterByOrigineArticle(products);
        },
        error: (error) => {
          console.error('Error fetching matching products for OG:', error);
          this.filteredProducts2 = [];
        }
      });
    }
  }

  filterByOrigineArticle(products: any[]): any[] {
    if (!this.order.origineArticle) {
      return products;
    }
    return products.filter(product => product.origineArticle === this.order.origineArticle);
  }

  getProductDisplayName(product: any): string {
    if (product.origineArticle === 'fabrication') {
        return `${product.article_code} - ${product.article_libelle}`;
    }
    const correctionValue = product.cylinder !== null ? product.cylinder : product.addition;
    return `${product.article_libelle} (${correctionValue}) - ${product.sphere}`;
  }

  onProductSelect() {
    if (this.order.produit) {
      this.orderService.getStockById(this.order.produit).subscribe({
        next: (stock) => {
          this.selectedProduct = stock;
          
          if (stock.article_id) {
            this.orderService.getArticleById(stock.article_id).subscribe({
              next: (article) => {
                this.selectedArticle = article;
                this.updatePrice();
              },
              error: (error) => {
                console.error('Error fetching article details:', error);
                this.selectedArticle = null;
                this.price = 0;
                this.updateTotalPrice();
              }
            });
          }
        },
        error: (error) => {
          console.error('Error fetching stock details:', error);
          this.selectedProduct = null;
          this.selectedArticle = null;
          this.price = 0;
          this.updateTotalPrice();
        }
      });
    } else {
      this.selectedProduct = null;
      this.selectedArticle = null;
      this.price = 0;
      this.updateTotalPrice();
    }
    this.updateStepEnabling();
  }

  onProduct2Select() {
    if (this.order.produit2) {
      this.orderService.getStockById(this.order.produit2).subscribe({
        next: (stock) => {
          this.selectedProduct2 = stock;
          
          if (stock.article_id) {
            this.orderService.getArticleById(stock.article_id).subscribe({
              next: (article) => {
                this.selectedArticle2 = article;
                this.updatePrice2();
              },
              error: (error) => {
                console.error('Error fetching article details for OG:', error);
                this.selectedArticle2 = null;
                this.price2 = 0;
                this.updateTotalPrice();
              }
            });
          }
        },
        error: (error) => {
          console.error('Error fetching stock details for OG:', error);
          this.selectedProduct2 = null;
          this.selectedArticle2 = null;
          this.price2 = 0;
          this.updateTotalPrice();
        }
      });
    } else {
      this.selectedProduct2 = null;
      this.selectedArticle2 = null;
      this.price2 = 0;
      this.updateTotalPrice();
    }
  }

  updatePrice() {
    if (this.selectedArticle) {
      const basePrice = parseFloat(this.selectedArticle.prix_vente) || 0;
      
      let finalPrice = basePrice;
      if (this.order.origineArticle === 'fabrication') {
        finalPrice += 50;
      }

      this.price = finalPrice;
    } else {
      this.price = 0;
    }
    this.updateTotalPrice();
  }

  updatePrice2() {
    if (this.selectedArticle2) {
      const basePrice = parseFloat(this.selectedArticle2.prix_vente) || 0;
      
      let finalPrice = basePrice;
      if (this.order.origineArticle === 'fabrication') {
        finalPrice += 50;
      }

      this.price2 = finalPrice;
    } else {
      this.price2 = 0;
    }
    this.updateTotalPrice();
  }

  updateTotalPrice() {
    this.totalPrice = (this.price || 0) + (this.price2 || 0);
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
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
  }

  copyToOD() {
    this.order.od.sphere = this.order.og.sphere;
    this.order.od.cylinder = this.order.og.cylinder;
    this.order.od.axe = this.order.og.axe;
    this.order.od.addition = this.order.od.addition;
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
  }

  copyFieldToOG(field: 'sphere' | 'cylinder' | 'axe' | 'addition') {
    this.order.og[field] = this.order.od[field];
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
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

  updateFormValidity() {
    this.errors.formInvalid = 
      this.errors.od.axe || 
      this.errors.od.addition || 
      this.errors.og.axe || 
      this.errors.og.addition || 
      this.errors.phone || 
      this.errors.email;
  }

  async submitOrder() {
    this.validateAxeAndAddition();
    this.validatePhoneSenegal();
    this.validateEmail();
    
    // Additional validation for second product
    if (this.needsSecondProduct && !this.order.produit2) {
      alert('Veuillez sélectionner un produit pour l\'œil gauche (OG) car les valeurs de correction sont différentes.');
      return;
    }
    
    // Validation for precal file requirement
    if (this.order.typeCommande === 'precal' && !this.selectedFile) {
      alert('Veuillez sélectionner un fichier pour les commandes de type Précal.');
      return;
    }
    
    if (this.errors.formInvalid) {
      alert('Veuillez corriger les erreurs du formulaire avant de soumettre.');
      return;
    }
    try {
      // Prepare order data with additional fields
      const orderData = {
        ...this.order,
        price: this.price,
        price2: this.price2,
        totalPrice: this.totalPrice,
        shippingType: this.shippingType,
        deliveryTime: this.deliveryTime,
        selectedProduct: this.selectedProduct,
        selectedProduct2: this.selectedProduct2,
        selectedArticle: this.selectedArticle,
        selectedArticle2: this.selectedArticle2,
        needsSecondProduct: this.needsSecondProduct,
        client_id: this.authService.getClientId()
      };

      // First create the order
      const orderResponse = await this.orderService.createOrder(orderData).toPromise();
      
      // If there's a file and it's a precal type de commande, upload it
      if (this.selectedFile && this.order.typeCommande === 'precal') {
        const orderId = orderResponse.id;
        await this.orderService.uploadFile(this.selectedFile, orderId).toPromise();
      }

      alert('Commande soumise avec succès!');
      this.router.navigate(['/orders']);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Une erreur est survenue lors de la soumission de la commande.');
    }
  }

  areAllCorrectionsFilled(): boolean {
    const { od, og } = this.order;
    return (
      od.sphere !== '' && od.cylinder !== '' && od.axe !== '' && od.addition !== '' &&
      og.sphere !== '' && og.cylinder !== '' && og.axe !== '' && og.addition !== ''
    );
  }

  blockNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
  }

  checkCorrectionsForStep3() {
    this.errors.step3Disabled = !this.areAllCorrectionsFilled();
  }

  // Restore method to filter products for OG based on OG correction values
  filterProductsForOG() {
    if (!this.areAllCorrectionsFilled() || !this.order.typeCorrection) {
      this.filteredProducts2 = [];
      return;
    }

    const { sphere, cylinder, addition } = this.order.og;
    switch (this.order.typeCorrection) {
      case 'loin':
        this.filterProducts2BySphereAndCylinder(sphere, cylinder);
        break;
      case 'pres':
        const spherePlusAddition = parseFloat(sphere) + parseFloat(addition);
        this.filterProducts2BySphereAndCylinder(spherePlusAddition.toString(), cylinder);
        break;
      case 'loin_pres':
        this.filterProducts2BySphereAndAddition(sphere, addition);
        break;
    }
  }
} 