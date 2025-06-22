import { Component } from '@angular/core';
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
export class ClientCreateOrderComponent {
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
    produit: ''
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
  selectedProduct: any = null;
  selectedArticle: any = null;

  selectedFileName: string = '';
  selectedFile: File | null = null;

  price: number = 0;
  shippingType: string = '';
  deliveryTime: string = '';

  // Validation error states
  errors = {
    od: { axe: false, addition: false },
    og: { axe: false, addition: false },
    phone: false,
    email: false,
    step4Disabled: true,
    step5Disabled: true,
    step6Disabled: true,
    formInvalid: false
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize with empty product list
    this.filteredProducts = [];
    this.updateStepEnabling();
  }

  // --- VALIDATION HELPERS ---
  validateAxeAndAddition() {
    // Validate OD
    this.errors.od.axe = this.isNegative(this.order.od.axe);
    this.errors.od.addition = this.isNegative(this.order.od.addition);
    // Validate OG
    this.errors.og.axe = this.isNegative(this.order.og.axe);
    this.errors.og.addition = this.isNegative(this.order.og.addition);
  }

  isNegative(value: any): boolean {
    if (value === '' || value === null || value === undefined) return false;
    return !isNaN(value) && parseFloat(value) < 0;
  }

  validatePhoneSenegal(): boolean {
    // Senegal numbers: 9 digits, start with 7 (e.g., 77, 78, 76, 70, 75, 72, 73, 74)
    const phone = this.order.phone.replace(/\D/g, '');
    const senegalPattern = /^(7[05678]\d{7})$/;
    this.errors.phone = !senegalPattern.test(phone);
    return !this.errors.phone;
  }

  validateEmail(): boolean {
    // Simple email regex
    const email = this.order.email || '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.errors.email = !emailPattern.test(email);
    return !this.errors.email;
  }

  // --- STEP ENABLING LOGIC ---
  updateStepEnabling() {
    // Step 4 enabled if step 3 (typeCommande) is selected
    this.errors.step4Disabled = !this.order.typeCommande;
    // Step 5 enabled if step 4 (typeCorrection) is selected
    this.errors.step5Disabled = !this.order.typeCorrection;
    // Step 6 enabled if step 5 (origineArticle) is selected
    this.errors.step6Disabled = !this.order.origineArticle;
  }

  // --- HOOKS FOR SELECTS ---
  onTypeCommandeChange() {
    // Reset file name if type de commande changes
    if (this.order.typeCommande !== 'precal') {
      this.selectedFileName = '';
    }
    this.order.typeCorrection = '';
    this.order.origineArticle = '';
    this.order.produit = '';
    this.updateStepEnabling();
  }

  onTypeCorrectionChange() {
    this.updateStepEnabling();
    if (this.areAllCorrectionsFilled() && this.order.typeCorrection) {
      const { sphere, cylinder, addition } = this.order.od;
      
      // Apply different filtering logic based on type de correction
      switch (this.order.typeCorrection) {
        case 'loin':
          // Filter based on sphere and cylinder
          this.filterProductsBySphereAndCylinder(sphere, cylinder);
          break;
        case 'pres':
          // Filter based on (sphere + addition) and cylinder
          const spherePlusAddition = parseFloat(sphere) + parseFloat(addition);
          this.filterProductsBySphereAndCylinder(spherePlusAddition.toString(), cylinder);
          break;
        case 'loin_pres':
          // Filter based on sphere and addition
          this.filterProductsBySphereAndAddition(sphere, addition);
          break;
      }
    } else {
      this.filteredProducts = [];
    }
  }

  onOrigineArticleChange() {
    this.updateStepEnabling();
    if (this.order.origineArticle === 'fabrication') {
      // Get all fabrication products without filtering by corrections
      this.orderService.getFabricationProducts().subscribe({
        next: (products) => {
          this.filteredProducts = products;
          console.log('Fabrication products:', this.filteredProducts);
        },
        error: (error) => {
          console.error('Error fetching fabrication products:', error);
          this.filteredProducts = [];
        }
      });
    } else {
      // Reapply the current correction filter with the new origineArticle
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
      }
    }
  }

  filterProductsBySphereAndCylinder(sphere: string, cylinder: string) {
    if (sphere && cylinder) {
      this.orderService.getMatchingProducts(sphere, cylinder).subscribe({
        next: (products) => {
          // Filter products based on origineArticle if selected
          this.filteredProducts = this.filterByOrigineArticle(products);
          console.log('Matching products:', this.filteredProducts);
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
          // Filter products based on origineArticle if selected
          this.filteredProducts = this.filterByOrigineArticle(products);
          console.log('Matching products:', this.filteredProducts);
        },
        error: (error) => {
          console.error('Error fetching matching products:', error);
          this.filteredProducts = [];
        }
      });
    }
  }

  filterByOrigineArticle(products: any[]): any[] {
    if (!this.order.origineArticle) {
      return products;
    }
    products.filter(product => console.log(product));
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
      // First get the stock details
      this.orderService.getStockById(this.order.produit).subscribe({
        next: (stock) => {
          this.selectedProduct = stock;
          console.log('Selected stock:', stock);
          
          // Then get the article details to get the prix_vente
          if (stock.article_id) {
            this.orderService.getArticleById(stock.article_id).subscribe({
              next: (article) => {
                this.selectedArticle = article;
                console.log('Selected article:', article);
                this.updatePrice();
              },
              error: (error) => {
                console.error('Error fetching article details:', error);
                this.selectedArticle = null;
                this.price = 0;
              }
            });
          }
        },
        error: (error) => {
          console.error('Error fetching stock details:', error);
          this.selectedProduct = null;
          this.selectedArticle = null;
          this.price = 0;
        }
      });
    } else {
      this.selectedProduct = null;
      this.selectedArticle = null;
      this.price = 0;
    }
  }

  updatePrice() {
    if (this.selectedArticle) {
      // Get the base price from the article's prix_vente
      const basePrice = this.selectedArticle.prix_vente || 0;
      
      // Add origine article cost if applicable
      let totalPrice = basePrice;
      if (this.order.origineArticle === 'fabrication') {
        totalPrice += 50; // Additional cost for fabrication
      }

      this.price = totalPrice;
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
    this.order.od.addition = this.order.od.addition;
  }

  copyFieldToOG(field: 'sphere' | 'cylinder' | 'axe' | 'addition') {
    this.order.og[field] = this.order.od[field];
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
    this.validateAxeAndAddition();
    this.validatePhoneSenegal();
    this.validateEmail();
    this.errors.formInvalid = this.errors.od.axe || this.errors.od.addition || this.errors.og.axe || this.errors.og.addition || this.errors.phone || this.errors.email;
    if (this.errors.formInvalid) {
      alert('Veuillez corriger les erreurs du formulaire avant de soumettre.');
      return;
    }
    try {
      // Prepare order data with additional fields
      const orderData = {
        ...this.order,
        price: this.price,
        shippingType: this.shippingType,
        deliveryTime: this.deliveryTime,
        selectedProduct: this.selectedProduct,
        selectedArticle: this.selectedArticle,
        client_id: this.authService.getClientId()
      };

      // First create the order
      const orderResponse = await this.orderService.createOrder(orderData).toPromise();
      console.log('Order response:', orderResponse);
      // If there's a file and it's a precal type de commande, upload it
      if (this.selectedFile && this.order.typeCommande === 'precal') {
        const orderId = orderResponse.id; // Assuming the backend returns the order ID
        await this.orderService.uploadFile(this.selectedFile, orderId).toPromise();
      }

      alert('Commande soumise avec succès!');
      this.router.navigate(['/orders']); // Navigate to orders list or confirmation page
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
} 