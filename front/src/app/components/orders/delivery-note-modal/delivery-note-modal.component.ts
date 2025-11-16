import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../shared/models/customer.model';
import { OrderService } from '../../../services/order.service';
import { BlService } from '../../../services/bl.service';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Order {
  id: number;
  order_id: number;
  order_datetime: string;
  status: string;
  price: string;
  price2?: string;
  first_name: string;
  last_name: string;
  shipping_type: string;
  delivery_time: string;
  produit: number;
  produit2?: number;
  typeCorrection: string;
  typeCommande: string;
  email?: string;
  phone?: string;
  raison_social: string;
  client_id: number;
  article_libelle?: string;
  article_libelle2?: string;
  isFabrication1?: boolean;
  isFabrication2?: boolean;
  [key: string]: any;
}

interface Page {
  orders: Order[];
  pageNumber: number;
  isLastPage: boolean;
}

@Component({
  selector: 'app-delivery-note-modal',
  templateUrl: './delivery-note-modal.component.html',
  styleUrls: ['./delivery-note-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DeliveryNoteModalComponent implements OnInit {
  currentDate: string;
  deliveryNoteNumber: string;
  customerDetails: Customer | null = null;
  totalAmount: number = 0;
  pages: Page[] = [];
  maxRowsPerPage: number = 5; // Set to 5 rows per page as requested
  isPrintView: boolean = false; // Track current view mode
  isGeneratingPDF: boolean = false; // Track PDF generation state
  pdfGenerationMethod: string = ''; // Track which method is being used

  constructor(
    public dialogRef: MatDialogRef<DeliveryNoteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orders: Order[] },
    private customerService: CustomerService,
    private orderService: OrderService,
    private blService: BlService,
    private authService: AuthService
  ) {
    this.currentDate = new Date().toLocaleDateString('fr-FR');
    this.deliveryNoteNumber = this.generateDeliveryNoteNumber();
  }

  formatValue(value: string): string {
    if (!value) return 'N/A';
    return value.replace(/_/g, ' ');
  }

  ngOnInit(): void {
    if (this.data.orders && this.data.orders.length > 0) {
      console.log('Initial Orders Data:', this.data.orders);
      const clientId = this.data.orders[0].client_id;
      this.loadCustomerDetails(clientId);
      this.loadProductDetails();
    }
  }

  loadCustomerDetails(clientId: number): void {
    this.customerService.getCustomerById(clientId).subscribe({
      next: (customer) => {
        console.log('Customer Details:', customer);
        this.customerDetails = customer;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
      }
    });
  }

  loadProductDetails(): void {
    const promises: Promise<void>[] = [];
    
    this.data.orders.forEach(order => {
      // First product: check fabrication1, otherwise use stock
      if (order['fabrication1']) {
        const promise = this.orderService.getArticleById(order['fabrication1'].toString()).toPromise()
          .then(article => {
            order.article_libelle = article.libelle;
            order.isFabrication1 = article.origineArticle === 'fabrication';
          })
          .catch(error => {
            console.error('Error loading fabrication article details:', error);
          });
        promises.push(promise);
      } else if (order.produit) {
        const promise = this.orderService.getStockById(order.produit.toString()).toPromise()
          .then(stock => {
            if (stock.article_id) {
              return this.orderService.getArticleById(stock.article_id.toString()).toPromise();
            }
            return null;
          })
          .then(article => {
            if (article) {
              order.article_libelle = article.libelle;
              order.isFabrication1 = article.origineArticle === 'fabrication';
            }
          })
          .catch(error => {
            console.error('Error loading article details:', error);
          });
        promises.push(promise);
      }
      
      // Second product: check fabrication2, otherwise use stock
      if (order['fabrication2']) {
        const promise = this.orderService.getArticleById(order['fabrication2'].toString()).toPromise()
          .then(article => {
            order.article_libelle2 = article.libelle;
            order.isFabrication2 = article.origineArticle === 'fabrication';
          })
          .catch(error => {
            console.error('Error loading fabrication2 article details:', error);
          });
        promises.push(promise);
      } else if (order.produit2) {
        const promise = this.orderService.getStockById(order.produit2.toString()).toPromise()
          .then(stock => {
            if (stock.article_id) {
              return this.orderService.getArticleById(stock.article_id.toString()).toPromise();
            }
            return null;
          })
          .then(article => {
            if (article) {
              order.article_libelle2 = article.libelle;
              order.isFabrication2 = article.origineArticle === 'fabrication';
            }
          })
          .catch(error => {
            console.error('Error loading article details for produit2:', error);
          });
        promises.push(promise);
      }
    });

    // Wait for all product details to load before creating pages
    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        console.log('All product details loaded, creating pages...');
        this.calculateTotal();
      });
    } else {
      console.log('No product details to load, creating pages immediately...');
      this.calculateTotal();
    }
  }

  calculateTotal(): void {
    this.totalAmount = this.data.orders.reduce((sum, order) => {
      const price = parseFloat(order.price) || 0;
      const price2 = parseFloat(order.price2 || '0') || 0;
      return sum + price + price2;
    }, 0);
    console.log('Total Amount:', this.totalAmount);
    console.log('Final Orders with all details:', this.data.orders);
    this.createPages();
    // Create BL after total is calculated
    this.createBlIfNotExists();
  }

  calculateOptimalRowsPerPage(totalRows: number, totalOrders: number): number {
    // Base calculation
    let optimalRows = Math.ceil(totalRows / Math.ceil(totalRows / this.maxRowsPerPage));
    
    // Adjust based on order count to avoid too many pages
    if (totalOrders <= this.maxRowsPerPage) {
      return this.maxRowsPerPage;
    }
    
    // If we have many orders but few rows, increase rows per page
    if (totalRows < totalOrders * 2) {
      optimalRows = Math.min(this.maxRowsPerPage + 2, totalRows);
    }
    
    // Ensure we don't exceed maximum
    return Math.min(optimalRows, this.maxRowsPerPage + 4);
  }

  createPages(): void {
    this.pages = [];
    const expandedOrders: Order[] = [];
    
    console.log('Creating pages for orders:', this.data.orders.length);
    
    // Expand orders that have two different products into separate rows
    this.data.orders.forEach(order => {
      if (order.article_libelle && order.article_libelle2 && order.article_libelle !== order.article_libelle2) {
        // Add first product
        expandedOrders.push({
          ...order,
          article_libelle2: undefined,
          price2: undefined,
          isFabrication2: undefined
        });
        // Add second product
        const secondProductOrder = {
          ...order,
          article_libelle: order.article_libelle2 || 'N/A',
          price: order.price2 || '0',
          article_libelle2: undefined,
          price2: undefined,
          isFabrication1: order.isFabrication2,
          isFabrication2: undefined
        };
        expandedOrders.push(secondProductOrder);
      } else {
        expandedOrders.push(order);
      }
    });

    console.log('Expanded orders:', expandedOrders.length);

    // If we have very few orders, put them all on one page
    if (expandedOrders.length <= this.maxRowsPerPage) {
      this.pages.push({
        orders: expandedOrders,
        pageNumber: 1,
        isLastPage: true
      });
      console.log('Single page created with all orders');
      return;
    }

    // Calculate optimal distribution
    const totalRows = expandedOrders.reduce((sum, order) => sum + this.getOrderRowCount(order), 0);
    const optimalRowsPerPage = this.calculateOptimalRowsPerPage(totalRows, expandedOrders.length);
    const estimatedPages = Math.ceil(totalRows / optimalRowsPerPage);
    
    console.log(`Total rows: ${totalRows}, Estimated pages: ${estimatedPages}, Optimal rows per page: ${optimalRowsPerPage}`);

    // Create pages with better distribution
    let currentPageOrders: Order[] = [];
    let rowCount = 0;
    let pageNumber = 1;

    for (let i = 0; i < expandedOrders.length; i++) {
      const order = expandedOrders[i];
      const orderRows = this.getOrderRowCount(order);
      
      console.log(`Order ${i + 1}: ${orderRows} rows, current page row count: ${rowCount}, target: ${optimalRowsPerPage}`);
      
      // Check if adding this order would exceed the target rows per page
      // But allow some flexibility to avoid very uneven distribution
      const remainingOrders = expandedOrders.length - i;
      const shouldStartNewPage = rowCount + orderRows > optimalRowsPerPage && 
                                currentPageOrders.length > 0 && 
                                (remainingOrders > 1 || rowCount + orderRows > optimalRowsPerPage + 2);
      
      if (shouldStartNewPage) {
        // Create new page
        console.log(`Creating page ${pageNumber} with ${currentPageOrders.length} orders (${rowCount} rows)`);
        this.pages.push({
          orders: currentPageOrders,
          pageNumber: pageNumber,
          isLastPage: false
        });
        
        currentPageOrders = [order];
        rowCount = orderRows;
        pageNumber++;
      } else {
        currentPageOrders.push(order);
        rowCount += orderRows;
      }
    }

    // Add the last page
    if (currentPageOrders.length > 0) {
      console.log(`Creating final page ${pageNumber} with ${currentPageOrders.length} orders (${rowCount} rows)`);
      this.pages.push({
        orders: currentPageOrders,
        pageNumber: pageNumber,
        isLastPage: true
      });
    }

    // Update isLastPage flag for the actual last page
    if (this.pages.length > 0) {
      this.pages[this.pages.length - 1].isLastPage = true;
    }

    console.log('Created pages:', this.pages);
    console.log('Total pages:', this.pages.length);
  }

  getOrderRowCount(order: Order): number {
    // Count how many rows this order will take
    if (order.article_libelle && order.article_libelle2 && order.article_libelle === order.article_libelle2) {
      return 1; // Single row with x2
    } else if (order.article_libelle2 && order.article_libelle !== order.article_libelle2) {
      return 2; // Two separate rows
    } else {
      return 1; // Single row
    }
  }

  generateDeliveryNoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BL-${year}${month}${day}-${random}`;
  }

  togglePrintView(): void {
    this.isPrintView = !this.isPrintView;
    const printPages = document.querySelector('.print-pages') as HTMLElement;
    const screenView = document.querySelector('.screen-view') as HTMLElement;
    
    if (printPages && screenView) {
      if (this.isPrintView) {
        printPages.style.display = 'block';
        screenView.style.display = 'none';
      } else {
        printPages.style.display = 'none';
        screenView.style.display = 'block';
      }
    }
  }

  exportToPDF(): void {
    if (this.isGeneratingPDF) {
      return; // Prevent multiple simultaneous PDF generations
    }

    if (this.isPrintView) {
      // In print view mode, export the current paginated view
      this.generatePDFFromPrintView();
    } else {
      // In screen view mode, temporarily show print view and export
      this.isPrintView = true;
      const printPages = document.querySelector('.print-pages') as HTMLElement;
      const screenView = document.querySelector('.screen-view') as HTMLElement;
      
      if (printPages && screenView) {
        printPages.style.display = 'block';
        screenView.style.display = 'none';
        
        // Use setTimeout to ensure the DOM is updated before generating PDF
        setTimeout(() => {
          this.generatePDFFromPrintView();
          
          // Restore screen view after PDF generation
          setTimeout(() => {
            this.isPrintView = false;
            printPages.style.display = 'none';
            screenView.style.display = 'block';
          }, 100);
        }, 100);
      }
    }
  }

  private async generatePDFFromPrintView(): Promise<void> {
    try {
      await this.generatePDFWithRetry();
    } catch (error) {
      console.error('Primary PDF generation failed, trying fallback method:', error);
      try {
        await this.generatePDFFallback();
      } catch (fallbackError) {
        console.error('All PDF generation methods failed:', fallbackError);
        this.handlePDFError(fallbackError);
      }
    }
  }

  private async generatePDFWithRetry(): Promise<void> {
    this.isGeneratingPDF = true;
    this.pdfGenerationMethod = 'High-quality rendering';
    
    try {
      console.log('Starting PDF generation with retry logic...');
      
      const printPagesElement = document.querySelector('.print-pages') as HTMLElement;
      if (!printPagesElement) {
        throw new Error('Print pages element not found in DOM');
      }

      console.log('Found print pages element, hiding controls...');

      // Hide the print view controls before generating PDF
      const controlsElement = printPagesElement.querySelector('div:first-child') as HTMLElement;
      if (controlsElement) {
        controlsElement.style.display = 'none';
      }

      // Prepare DOM for PDF generation
      await this.prepareDOMForPDF(printPagesElement);

      // Create PDF with A5 landscape format
      console.log('Creating PDF document...');
      const pdf = new jsPDF('landscape', 'mm', 'a5');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      console.log(`PDF page dimensions: ${pageWidth}mm x ${pageHeight}mm`);
      
      // Get all pages
      const pageElements = printPagesElement.querySelectorAll('.page');
      const totalPages = pageElements.length;
      
      console.log(`Found ${totalPages} pages to process`);

      if (totalPages === 0) {
        throw new Error('No pages found to convert to PDF');
      }

      // Process pages with retry logic
      for (let i = 0; i < totalPages; i++) {
        const pageElement = pageElements[i] as HTMLElement;
        
        console.log(`Processing page ${i + 1}/${totalPages}...`);
        console.log(`Page element dimensions: ${pageElement.offsetWidth}px x ${pageElement.offsetHeight}px`);
        
        // Check if page element has content
        if (!pageElement.innerHTML.trim()) {
          console.warn(`Page ${i + 1} appears to be empty, skipping...`);
          continue;
        }
        
        // Retry logic for page conversion
        let canvas: HTMLCanvasElement | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!canvas && retryCount < maxRetries) {
          try {
            retryCount++;
            console.log(`Attempt ${retryCount} to convert page ${i + 1} to canvas...`);
            
            // Ensure the page is visible and properly rendered
            pageElement.style.display = 'block';
            pageElement.style.visibility = 'visible';
            pageElement.style.opacity = '1';
            
            // Force a reflow to ensure all content is rendered
            pageElement.offsetHeight;
            
            // Wait a bit for any animations or rendering to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Convert page to canvas with more conservative settings
            canvas = await html2canvas(pageElement, {
              scale: 1.5, // Reduced scale for better stability
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: pageElement.offsetWidth,
              height: pageElement.offsetHeight,
              logging: false,
              foreignObjectRendering: false, // Disable for better compatibility
              removeContainer: true, // Clean up after conversion
              onclone: (clonedDoc) => {
                // Ensure the cloned element is properly set up
                const clonedElement = clonedDoc.querySelector('.page') as HTMLElement;
                if (clonedElement) {
                  clonedElement.style.display = 'block';
                  clonedElement.style.visibility = 'visible';
                  clonedElement.style.opacity = '1';
                  clonedElement.style.position = 'relative';
                  clonedElement.style.overflow = 'visible';
                }
              }
            });

            console.log(`Canvas created for page ${i + 1}: ${canvas.width}px x ${canvas.height}px`);
            
            // Validate canvas data
            if (canvas.width === 0 || canvas.height === 0) {
              throw new Error('Canvas has zero dimensions');
            }
            
            // Test if canvas data is valid by trying to get image data
            const testData = canvas.toDataURL('image/png');
            if (!testData || testData === 'data:,') {
              throw new Error('Canvas data is invalid');
            }
            
          } catch (pageError: any) {
            console.error(`Attempt ${retryCount} failed for page ${i + 1}:`, pageError);
            
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to convert page ${i + 1} after ${maxRetries} attempts: ${pageError.message || 'Unknown error'}`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!canvas) {
          throw new Error(`Failed to create canvas for page ${i + 1}`);
        }

        try {
          // Add page to PDF
          if (i > 0) {
            pdf.addPage();
          }

          // Calculate dimensions to fit A5
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          console.log(`Adding image to PDF: ${imgWidth}mm x ${imgHeight}mm`);
          
          // Add image to PDF with error handling
          const imgData = canvas.toDataURL('image/png', 0.9); // Slightly reduced quality for stability
          
          if (!imgData || imgData === 'data:,') {
            throw new Error('Invalid image data generated');
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          console.log(`Page ${i + 1} added to PDF successfully`);
          
        } catch (pdfError: any) {
          console.error(`Error adding page ${i + 1} to PDF:`, pdfError);
          throw new Error(`Failed to add page ${i + 1} to PDF: ${pdfError.message || 'Unknown error'}`);
        }
      }

      // Show controls again
      if (controlsElement) {
        controlsElement.style.display = 'block';
      }

      // Download the PDF
      const fileName = `delivery-note-${this.deliveryNoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log(`Saving PDF as: ${fileName}`);
      pdf.save(fileName);
      
      console.log('PDF generation completed successfully');

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      throw error; // Re-throw to trigger fallback
    } finally {
      this.isGeneratingPDF = false;
      this.pdfGenerationMethod = '';
    }
  }

  private async prepareDOMForPDF(printPagesElement: HTMLElement): Promise<void> {
    console.log('Preparing DOM for PDF generation...');
    
    // Ensure all pages are visible and properly styled
    const pageElements = printPagesElement.querySelectorAll('.page');
    
    for (let i = 0; i < pageElements.length; i++) {
      const pageElement = pageElements[i] as HTMLElement;
      
      // Set explicit styles for PDF generation
      pageElement.style.display = 'block';
      pageElement.style.visibility = 'visible';
      pageElement.style.opacity = '1';
      pageElement.style.position = 'relative';
      pageElement.style.overflow = 'visible';
      pageElement.style.backgroundColor = '#ffffff';
      pageElement.style.color = '#000000';
      pageElement.style.fontFamily = 'Arial, sans-serif';
      pageElement.style.fontSize = '12px';
      pageElement.style.lineHeight = '1.4';
      pageElement.style.margin = '0';
      pageElement.style.padding = '10px';
      pageElement.style.border = 'none';
      pageElement.style.boxShadow = 'none';
      
      // Ensure all child elements are visible
      const allElements = pageElement.querySelectorAll('*');
      allElements.forEach((element: Element) => {
        const el = element as HTMLElement;
        if (el.style.display === 'none') {
          el.style.display = 'block';
        }
        if (el.style.visibility === 'hidden') {
          el.style.visibility = 'visible';
        }
        if (el.style.opacity === '0') {
          el.style.opacity = '1';
        }
      });
    }
    
    // Force a reflow
    printPagesElement.offsetHeight;
    
    // Wait for any remaining rendering
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('DOM preparation completed');
  }

  private async generatePDFFallback(): Promise<void> {
    this.isGeneratingPDF = true;
    this.pdfGenerationMethod = 'Standard rendering';
    
    try {
      console.log('Starting fallback PDF generation...');
      
      const printPagesElement = document.querySelector('.print-pages') as HTMLElement;
      if (!printPagesElement) {
        throw new Error('Print pages element not found in DOM');
      }

      // Create PDF with A5 landscape format
      const pdf = new jsPDF('landscape', 'mm', 'a5');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Get all pages
      const pageElements = printPagesElement.querySelectorAll('.page');
      const totalPages = pageElements.length;
      
      console.log(`Found ${totalPages} pages to process in fallback mode`);
      
      if (totalPages === 0) {
        throw new Error('No pages found to convert to PDF');
      }

      // Process pages one by one with minimal settings
      for (let i = 0; i < totalPages; i++) {
        const pageElement = pageElements[i] as HTMLElement;
        
        console.log(`Processing page ${i + 1}/${totalPages} in fallback mode`);
        
        if (!pageElement.innerHTML.trim()) {
          console.warn(`Page ${i + 1} is empty, skipping...`);
          continue;
        }
        
        try {
          // Ensure page is visible and properly styled
          pageElement.style.display = 'block';
          pageElement.style.visibility = 'visible';
          pageElement.style.opacity = '1';
          pageElement.style.backgroundColor = '#ffffff';
          pageElement.style.color = '#000000';
          pageElement.style.position = 'relative';
          pageElement.style.overflow = 'visible';
          
          // Wait for rendering
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if element has dimensions
          if (pageElement.offsetWidth === 0 || pageElement.offsetHeight === 0) {
            console.warn(`Page ${i + 1} has zero dimensions, skipping...`);
            continue;
          }
          
          console.log(`Converting page ${i + 1} with dimensions: ${pageElement.offsetWidth}x${pageElement.offsetHeight}`);
          
          // Convert with minimal settings
          const canvas = await html2canvas(pageElement, {
            scale: 1, // Minimal scale
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            foreignObjectRendering: false,
            removeContainer: true,
            width: pageElement.offsetWidth,
            height: pageElement.offsetHeight
          });

          // Validate canvas
          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas has zero dimensions');
          }

          console.log(`Canvas created for page ${i + 1}: ${canvas.width}x${canvas.height}`);

          // Add page to PDF
          if (i > 0) {
            pdf.addPage();
          }

          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG instead of PNG
          
          if (!imgData || imgData === 'data:,') {
            throw new Error('Invalid image data generated');
          }
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          console.log(`Page ${i + 1} added successfully to PDF`);
          
        } catch (pageError: any) {
          console.error(`Fallback: Error processing page ${i + 1}:`, pageError);
          
          // Add page to PDF even if conversion failed
          if (i > 0) {
            pdf.addPage();
          }
          
          // Add a more informative placeholder page
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Page ${i + 1}`, 10, 20);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Content could not be rendered due to technical issues.', 10, 35);
          pdf.text('The system will try alternative rendering methods.', 10, 45);
          pdf.text(`Error details: ${pageError.message || 'Unknown error'}`, 10, 55);
          pdf.text('Please contact support if this issue persists.', 10, 65);
          
          console.log(`Added informative placeholder for page ${i + 1}`);
        }
      }

      // Download the PDF
      const fileName = `delivery-note-${this.deliveryNoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('Fallback PDF generation completed');

    } catch (error: any) {
      console.error('Fallback PDF generation failed:', error);
      throw error;
    } finally {
      this.isGeneratingPDF = false;
      this.pdfGenerationMethod = '';
    }
  }

  private handlePDFError(error: any): void {
    // Provide more specific error messages
    let errorMessage = 'Error generating PDF. Please try again.';
    
    if (error.message && error.message.includes('Print pages element not found')) {
      errorMessage = 'PDF generation failed: Could not find the document content. Please refresh and try again.';
    } else if (error.message && error.message.includes('No pages found')) {
      errorMessage = 'PDF generation failed: No content to convert. Please check if the delivery note has data.';
    } else if (error.message && error.message.includes('Failed to convert page')) {
      errorMessage = 'PDF generation failed: Error converting document pages. Please try again or refresh the page.';
    } else if (error.message && error.message.includes('Invalid image data')) {
      errorMessage = 'PDF generation failed: Error processing document images. Please try again.';
    } else if (error.message && error.message.includes('html2canvas')) {
      errorMessage = 'PDF generation failed: Error converting document to image. Please try again.';
    } else if (error.message && error.message.includes('jsPDF')) {
      errorMessage = 'PDF generation failed: Error creating PDF document. Please try again.';
    } else if (error.message && error.message.includes('PNG')) {
      errorMessage = 'PDF generation failed: Error processing document images. Please refresh the page and try again.';
    }
    
    alert(errorMessage);
  }

  printDeliveryNote(): void {
    // Keep the old print method for backward compatibility
    this.exportToPDF();
  }

  close(): void {
    this.dialogRef.close();
  }

  // Helper method to sum prices
  sumPrices(price1: string | number | null | undefined, price2: string | number | null | undefined): number {
    const p1 = typeof price1 === 'string' ? parseFloat(price1) || 0 : (price1 || 0);
    const p2 = typeof price2 === 'string' ? parseFloat(price2) || 0 : (price2 || 0);
    return p1 + p2;
  }

  // Create BL if it doesn't already exist
  createBlIfNotExists(): void {
    // Check if BL already exists by numero
    this.blService.getBlByNumero(this.deliveryNoteNumber).subscribe({
      next: (existingBl) => {
        // BL already exists, don't create again
        console.log('BL already exists, skipping creation');
      },
      error: (error) => {
        // BL doesn't exist (404), create it
        if (error.status === 404) {
          this.createNewBl();
        } else {
          console.error('Error checking BL existence:', error);
        }
      }
    });
  }

  // Create a new BL record
  createNewBl(): void {
    if (!this.customerDetails) {
      // Wait for customer details to load
      setTimeout(() => this.createNewBl(), 100);
      return;
    }

    const userData = this.authService.getUserData();
    const userCreate = userData?.nom && userData?.prenom 
      ? `${userData.prenom} ${userData.nom}` 
      : (userData?.raison_social || userData?.email || 'Unknown');

    const blData = {
      numero: this.deliveryNoteNumber,
      date: new Date().toISOString().split('T')[0],
      code_tier: this.customerDetails.codee || '',
      nom_raison_social: this.customerDetails.raison_social || '',
      total_ttc: this.totalAmount,
      mode_paie: '', // Empty as requested
      observation: '',
      user_create: userCreate,
      totreg: 0,
      deja_recu: 0,
      reste: this.totalAmount
    };

    this.blService.createBl(blData).subscribe({
      next: (response) => {
        console.log('BL created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating BL:', error);
      }
    });
  }
} 