import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-client-create-order',
  templateUrl: './client-create-order.component.html',
  styleUrls: ['./client-create-order.component.css'],
  standalone: false
})
export class ClientCreateOrderComponent implements OnInit, OnDestroy {
  isMobile = false;
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
    produit2: '',
    fabrication1: '',
    fabrication2: ''
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
    od: { sphere: false, cylinder: false, axe: false, addition: false },
    og: { sphere: false, cylinder: false, axe: false, addition: false },
    phone: false,
    email: false,
    lastName: false,
    firstName: false,
    step3Disabled: true,
    step4Disabled: true,
    step5Disabled: true,
    step6Disabled: true,
    step6bDisabled: true,
    formInvalid: false
  };

  private validationTimeout: any;
  private previousCorrections: any = null; // Track previous correction values

  selectedClientId: number | null = null;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.checkMobile();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    // Check for clientId in query params (for admin creating orders)
    this.route.queryParams.subscribe(params => {
      if (params['clientId']) {
        this.selectedClientId = parseInt(params['clientId'], 10);
      }
    });
    
    this.filteredProducts = [];
    this.filteredProducts2 = [];
    this.updateStepEnabling();
    this.updateFormValidity();
    this.checkCorrectionsForStep3();
    
    // Initialize previous corrections tracking
    this.previousCorrections = {
      od: { ...this.order.od },
      og: { ...this.order.og }
    };
  }

  private handleResize = () => {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  validateAxeAndAddition() {
    this.validateSphere('od');
    this.validateCylinder('od');
    this.validateAxe('od');
    this.validateAddition('od');
    this.validateSphere('og');
    this.validateCylinder('og');
    this.validateAxe('og');
    this.validateAddition('og');
    
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
    this.updateFormValidity();
  }

  validateSphere(eye: 'od' | 'og') {
    const value = this.order[eye].sphere;
    if (value === '' || value === null || value === undefined) {
      this.errors[eye].sphere = false;
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.errors[eye].sphere = true;
      return;
    }
    // Sphère : entre –6.00 et +6.00
    this.errors[eye].sphere = numValue < -6.00 || numValue > 6.00;
  }

  validateCylinder(eye: 'od' | 'og') {
    const value = this.order[eye].cylinder;
    if (value === '' || value === null || value === undefined) {
      this.errors[eye].cylinder = false;
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.errors[eye].cylinder = true;
      return;
    }
    // Cylindre: Entre –0.25 à –6.00
    this.errors[eye].cylinder = numValue < -6.00 || numValue > -0.25;
  }

  validateAxe(eye: 'od' | 'og') {
    const value = this.order[eye].axe;
    if (value === '' || value === null || value === undefined) {
      this.errors[eye].axe = false;
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.errors[eye].axe = true;
      return;
    }
    // AXE: Min : 0° Max : 180°
    this.errors[eye].axe = numValue < 0 || numValue > 180;
  }

  validateAddition(eye: 'od' | 'og') {
    const value = this.order[eye].addition;
    if (value === '' || value === null || value === undefined) {
      this.errors[eye].addition = false;
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.errors[eye].addition = true;
      return;
    }
    // Addition (ADD): Min : 0 Max : 10
    this.errors[eye].addition = numValue < 0 || numValue > 10;
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
    
    // If values are the same, clear second product selection and set price2 = price1
    if (!this.needsSecondProduct) {
      this.order.produit2 = '';
      this.selectedProduct2 = null;
      this.selectedArticle2 = null;
      this.price2 = this.price; // Set price2 equal to price1 when values are the same
      this.filteredProducts2 = [];
    } else if (!wasDifferent && this.needsSecondProduct) {
      // If values just became different, trigger filtering for OG
      this.filterProductsForOG();
    }
    
    this.updateStepEnabling();
    this.updateTotalPrice();
    this.updateFormValidity();
  }

  validateEmail(): boolean {
    const email = this.order.email || '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.errors.email = !emailPattern.test(email);
    this.updateFormValidity();
    return !this.errors.email;
  }

  validateLastName(): boolean {
    this.errors.lastName = !this.order.lastName || this.order.lastName.trim() === '';
    this.updateFormValidity();
    return !this.errors.lastName;
  }

  validateFirstName(): boolean {
    this.errors.firstName = !this.order.firstName || this.order.firstName.trim() === '';
    this.updateFormValidity();
    return !this.errors.firstName;
  }

  validatePhoneSenegal(): boolean {
    const phone = this.order.phone.replace(/\D/g, '');
    const senegalPattern = /^(7[05678]\d{7})$/;
    this.errors.phone = !senegalPattern.test(phone);
    this.updateFormValidity();
    return !this.errors.phone;
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
    this.errors.step6bDisabled = !(this.isODFilled() && this.isOGFilled() && this.needsSecondProduct);
  }

  onTypeCommandeChange() {
    this.resetFieldsBelowTypeCommande();
    this.updateStepEnabling();
  }

  onTypeCorrectionChange() {
    this.resetFieldsBelowTypeCorrection();
    this.updateStepEnabling();
    // Filtering is now only handled in onOrigineArticleChange
  }

  onOrigineArticleChange() {
    this.resetFieldsBelowOrigineArticle();
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
    if (sphere !== '' && cylinder !== '') {
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
    if (sphere !== '' && addition !== '') {
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
    if (sphere !== '' && cylinder !== '') {
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
    if (sphere !== '' && addition !== '') {
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
      if (this.order.origineArticle === 'fabrication') {
        // For fabrication, produit is the article id
        this.orderService.getArticleById(this.order.produit).subscribe({
          next: (article) => {
            this.selectedArticle = article;
            this.selectedProduct = null;
            this.updatePrice();
          },
          error: (error) => {
            console.error('Error fetching article details:', error);
            this.selectedArticle = null;
            this.price = 0;
            this.updateTotalPrice();
          }
        });
      } else {
        // For stock, produit is the stock id
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
      }
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
      if (this.order.origineArticle === 'fabrication') {
        // For fabrication, produit2 is the article id
        this.orderService.getArticleById(this.order.produit2).subscribe({
          next: (article) => {
            this.selectedArticle2 = article;
            this.selectedProduct2 = null;
            this.updatePrice2();
          },
          error: (error) => {
            console.error('Error fetching article details for OG:', error);
            this.selectedArticle2 = null;
            this.price2 = 0;
            this.updateTotalPrice();
          }
        });
      } else {
        // For stock, produit2 is the stock id
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
      }
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
        finalPrice += 0;
      }

      this.price = finalPrice;
      
      // If correction values are the same, set price2 equal to price1
      if (!this.needsSecondProduct) {
        this.price2 = this.price;
      }
    } else {
      this.price = 0;
      // If correction values are the same, set price2 equal to price1
      if (!this.needsSecondProduct) {
        this.price2 = this.price;
      }
    }
    this.updateTotalPrice();
  }

  updatePrice2() {
    if (this.selectedArticle2) {
      const basePrice = parseFloat(this.selectedArticle2.prix_vente) || 0;
      
      let finalPrice = basePrice;
      if (this.order.origineArticle === 'fabrication') {
        finalPrice += 0;
      }

      this.price2 = finalPrice;
    } else {
      this.price2 = 0;
    }
    this.updateTotalPrice();
  }

  updateTotalPrice() {
    const baseTotal = (this.price || 0) + (this.price2 || 0);
    const shippingCost = this.shippingType === 'express' ? 3000 : 0;
    this.totalPrice = baseTotal + shippingCost;
  }

  onShippingTypeChange() {
    if (this.shippingType === 'free') {
      this.deliveryTime = '7-15 jours';
    } else if (this.shippingType === 'express') {
      this.deliveryTime = '4-7 jours';
    } else {
      this.deliveryTime = '';
    }
    this.updateTotalPrice();
  }

  copyToOG() {
    this.order.og.sphere = this.order.od.sphere;
    this.order.og.cylinder = this.order.od.cylinder;
    this.order.og.axe = this.order.od.axe;
    this.order.og.addition = this.order.od.addition;
    this.validateAxeAndAddition();
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
  }

  copyToOD() {
    this.order.od.sphere = this.order.og.sphere;
    this.order.od.cylinder = this.order.og.cylinder;
    this.order.od.axe = this.order.og.axe;
    this.order.od.addition = this.order.og.addition;
    this.validateAxeAndAddition();
    this.checkIfValuesAreDifferent();
    this.checkCorrectionsForStep3();
  }

  copyFieldToOG(field: 'sphere' | 'cylinder' | 'axe' | 'addition') {
    this.order.og[field] = this.order.od[field];
    this.validateAxeAndAddition();
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
      (this.isODFilled() && (this.errors.od.sphere || this.errors.od.cylinder || this.errors.od.axe || this.errors.od.addition)) ||
      (this.isOGFilled() && (this.errors.og.sphere || this.errors.og.cylinder || this.errors.og.axe || this.errors.og.addition)) ||
      this.errors.phone ||
      this.errors.email ||
      this.errors.lastName ||
      this.errors.firstName;
  }

  async submitOrder() {
    this.validateAxeAndAddition();
    this.validatePhoneSenegal();
    this.validateEmail();
    this.validateLastName();
    this.validateFirstName();
    
    // Validate correction values before submission
    if (this.isODFilled()) {
      this.validateSphere('od');
      this.validateCylinder('od');
      this.validateAxe('od');
      this.validateAddition('od');
    }
    if (this.isOGFilled()) {
      this.validateSphere('og');
      this.validateCylinder('og');
      this.validateAxe('og');
      this.validateAddition('og');
    }
    
    // Check if all required Porteur fields are filled
    if (!this.order.lastName || this.order.lastName.trim() === '') {
      alert('Veuillez remplir le nom de famille.');
      return;
    }
    
    if (!this.order.firstName || this.order.firstName.trim() === '') {
      alert('Veuillez remplir le prénom.');
      return;
    }
    
    if (!this.order.phone || this.order.phone.trim() === '') {
      alert('Veuillez remplir le numéro de téléphone.');
      return;
    }
    
    if (!this.order.email || this.order.email.trim() === '') {
      alert('Veuillez remplir l\'adresse email.');
      return;
    }

    // --- PRODUCT SELECTION VALIDATION ---
    // At least one eye must be filled
    if (!this.isODFilled() && !this.isOGFilled()) {
      alert('Veuillez remplir les corrections pour OD ou OG.');
      return;
    }
    // Product selection validation
    if (this.isODFilled() && !this.order.produit) {
      alert('Veuillez sélectionner un produit pour OD.');
      return;
    }
    // Only require produit2 if values are different (needsSecondProduct is true)
    if (this.isOGFilled() && this.needsSecondProduct && !this.order.produit2) {
      alert('Veuillez sélectionner un produit pour OG.');
      return;
    }
    // --- END PRODUCT SELECTION VALIDATION ---
    
    // Validation for precal file requirement
    if (this.order.typeCommande === 'precal' && !this.selectedFile) {
      alert('Veuillez sélectionner un fichier pour les commandes de type Précal.');
      return;
    }

    // Validation for shipping type (Type de Livraison)
    if (!this.shippingType) {
      alert('Veuillez sélectionner un type de livraison avant de soumettre la commande.');
      return;
    }
    
    if (this.errors.formInvalid) {
      alert('Veuillez corriger les erreurs du formulaire avant de soumettre.');
      return;
    }
    try {
      // Prepare order data with additional fields
      let orderData: any = {
        ...this.order,
        price: this.isODFilled() ? this.price : 0,
        price2: this.isOGFilled() ? this.price2 : 0,
        totalPrice: this.totalPrice,
        shippingType: this.shippingType,
        deliveryTime: this.deliveryTime,
        selectedProduct: this.selectedProduct,
        selectedProduct2: this.selectedProduct2,
        selectedArticle: this.selectedArticle,
        selectedArticle2: this.selectedArticle2,
        needsSecondProduct: this.isODFilled() && this.isOGFilled() && this.needsSecondProduct,
        client_id: this.selectedClientId || this.authService.getClientId()
      };

      // Handle fabrication/stock logic
      // If values are the same, use the same product for both eyes
      if (this.order.origineArticle === 'fabrication') {
        orderData.fabrication1 = this.isODFilled() ? (this.order.produit || '') : '';
        // If values are the same, use the same product for OG
        if (this.isOGFilled() && !this.needsSecondProduct) {
          orderData.fabrication2 = this.isODFilled() ? (this.order.produit || '') : '';
        } else {
          orderData.fabrication2 = this.isOGFilled() ? (this.order.produit2 || '') : '';
        }
        orderData.produit = '';
        orderData.produit2 = '';
      } else {
        orderData.produit = this.isODFilled() ? this.order.produit : '';
        // If values are the same, use the same product for OG
        if (this.isOGFilled() && !this.needsSecondProduct) {
          orderData.produit2 = this.isODFilled() ? this.order.produit : '';
        } else {
          orderData.produit2 = this.isOGFilled() ? this.order.produit2 : '';
        }
        orderData.fabrication1 = '';
        orderData.fabrication2 = '';
      }
      
      // Also update selectedProduct2 and selectedArticle2 when values are the same
      if (this.isOGFilled() && !this.needsSecondProduct) {
        orderData.selectedProduct2 = orderData.selectedProduct;
        orderData.selectedArticle2 = orderData.selectedArticle;
        orderData.price2 = orderData.price;
      }

      // First create the order
      const orderResponse = await this.orderService.createOrder(orderData).toPromise();
      
      // If there's a file and it's a precal type de commande, upload it
      if (this.selectedFile && this.order.typeCommande === 'precal') {
        const orderId = orderResponse.id;
        await this.orderService.uploadFile(this.selectedFile, orderId).toPromise();
      }

      alert('Commande soumise avec succès!');
      // Navigate back to admin-client-orders if created from admin, otherwise to client orders
      if (this.selectedClientId) {
        this.router.navigate(['/app/admin-client-orders']);
      } else {
        this.router.navigate(['/client/orders']);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Une erreur est survenue lors de la soumission de la commande.');
    }
  }

  isODFilled(): boolean {
    const { od } = this.order;
    return od.sphere !== '' && od.cylinder !== '' && od.axe !== '' && od.addition !== '';
  }

  isOGFilled(): boolean {
    const { og } = this.order;
    return og.sphere !== '' && og.cylinder !== '' && og.axe !== '' && og.addition !== '';
  }

  areAllCorrectionsFilled(): boolean {
    // Allow if either OD or OG is filled
    return this.isODFilled() || this.isOGFilled();
  }

  blockNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
  }

  checkCorrectionsForStep3() {
    this.errors.step3Disabled = !this.areAllCorrectionsFilled();
    
    // Check if corrections have actually changed
    const currentCorrections = {
      od: { ...this.order.od },
      og: { ...this.order.og }
    };
    
    if (this.previousCorrections && this.order.typeCommande) {
      const hasChanged = 
        JSON.stringify(this.previousCorrections) !== JSON.stringify(currentCorrections);
      
      if (hasChanged) {
        // Reset fields below Type de commande if corrections actually changed
        this.resetFieldsBelowTypeCommande();
      }
    }
    
    // Update previous corrections
    this.previousCorrections = currentCorrections;
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

  // Reset all fields below Type de commande when corrections change
  resetFieldsBelowTypeCommande() {
    // Do NOT reset typeCommande itself here
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
    // Reset file selection
    this.selectedFileName = '';
    this.selectedFile = null;
  }

  resetFieldsBelowTypeCorrection() {
    this.order.origineArticle = '';
    this.order.produit = '';
    this.order.produit2 = '';
    this.selectedProduct = null;
    this.selectedProduct2 = null;
    this.selectedArticle = null;
    this.selectedArticle2 = null;
    this.price = 0;
    this.price2 = 0;
    this.totalPrice = 0;
    this.filteredProducts = [];
    this.filteredProducts2 = [];
    this.shippingType = '';
    this.deliveryTime = '';
    this.selectedFileName = '';
    this.selectedFile = null;
  }

  resetFieldsBelowOrigineArticle() {
    this.order.produit = '';
    this.order.produit2 = '';
    this.selectedProduct = null;
    this.selectedProduct2 = null;
    this.selectedArticle = null;
    this.selectedArticle2 = null;
    this.price = 0;
    this.price2 = 0;
    this.totalPrice = 0;
    this.filteredProducts = [];
    this.filteredProducts2 = [];
    this.shippingType = '';
    this.deliveryTime = '';
    this.selectedFileName = '';
    this.selectedFile = null;
  }
} 
