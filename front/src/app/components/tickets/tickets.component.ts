import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';
import { StockService } from '../../services/stock.service';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TicketsComponent implements OnInit {
  orders: Order[] = [];
  printedOrders: Order[] = [];
  printedTicketsCollapsed: boolean = true;
  gridCells: any[] = [];
  draggedOrder: Order | null = null;
  draggedFromCell: number | null = null;
  draggedFromList: boolean = false;

  // New state for confirmation modal
  showEyeModal: boolean = false;
  pendingDropCell: any = null;
  pendingDropOrder: Order | null = null;

  // Track which eyes are placed for each order
  placedEyes: { [orderId: number]: { right: boolean; left: boolean } } = {};

  private diameterCache: { [key: string]: Observable<string> } = {};
  private articleNameCache: { [key: string]: Observable<string> } = {};

  constructor(private orderService: OrderService, private stockService: StockService, private articleService: ArticleService) {}

  ngOnInit() {
    this.loadOrders();
    this.initializeGrid();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders.filter((order: Order) => order.status?.toLowerCase() === 'processing');
        this.printedOrders = orders.filter((order: Order) => {
          const status = order.status?.toLowerCase();
          return status === 'shipped' || status === 'delivered';
        });
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
  }

  initializeGrid() {
    // Create 24 grid cells (3x8 grid)
    this.gridCells = Array(24).fill(null).map((_, index) => ({
      index,
      ticket: null // { order, eye: 'right' | 'left' }
    }));
  }

  onDragStart(order: Order, event: DragEvent) {
    this.draggedOrder = order;
    this.draggedFromCell = null;
    this.draggedFromList = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onCellDragStart(cell: any, event: DragEvent) {
    if (cell.ticket) {
      this.draggedOrder = cell.ticket.order;
      this.draggedFromCell = cell.index;
      this.draggedFromList = false;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    } else {
      event.preventDefault();
    }
  }

  onDragOver(event: DragEvent, cell: any) {
    event.preventDefault();
    cell.dragOver = true;
  }

  onDragLeave(event: DragEvent, cell: any) {
    cell.dragOver = false;
  }

  onDrop(event: DragEvent, cell: any) {
    event.preventDefault();
    cell.dragOver = false;
    if (this.draggedOrder) {
      // If dragging from another cell, move the ticket
      if (this.draggedFromCell !== null && this.draggedFromCell !== undefined) {
        const sourceCell = this.gridCells[this.draggedFromCell];
        // Move the ticket
        cell.ticket = sourceCell.ticket;
        sourceCell.ticket = null;
        // Reset drag state
        this.draggedOrder = null;
        this.draggedFromCell = null;
        this.draggedFromList = false;
        return;
      }
      // Show confirmation modal for eye selection if dragging from list
      this.showEyeModal = true;
      this.pendingDropCell = cell;
      this.pendingDropOrder = this.draggedOrder;
    }
    this.draggedOrder = null;
    this.draggedFromCell = null;
    this.draggedFromList = false;
  }

  confirmEye(eye: 'right' | 'left') {
    if (!this.pendingDropCell || !this.pendingDropOrder) return;
    // Place the ticket in the cell
    this.pendingDropCell.ticket = {
      order: this.pendingDropOrder,
      eye
    };
    // Mark the eye as placed
    const orderId = this.pendingDropOrder.order_id;
    if (!this.placedEyes[orderId]) {
      this.placedEyes[orderId] = { right: false, left: false };
    }
    this.placedEyes[orderId][eye] = true;
    // Remove from list if both eyes are placed
    if (this.placedEyes[orderId].right && this.placedEyes[orderId].left) {
      this.orders = this.orders.filter(o => o.order_id !== orderId);
    }
    // Hide modal and clear pending
    this.showEyeModal = false;
    this.pendingDropCell = null;
    this.pendingDropOrder = null;
  }

  cancelEyeModal() {
    this.showEyeModal = false;
    this.pendingDropCell = null;
    this.pendingDropOrder = null;
  }

  printGrid() {
    window.print();
  }

  getDiametre(order: Order, eye: 'right' | 'left' = 'right'): Observable<string> {
    // Use produit for right eye (OD), produit2 for left eye (OG)
    // If produit2 is not available for left eye, fall back to produit (same as OD)
    let productId = eye === 'right' ? order.produit : order.produit2;
    
    // If left eye and produit2 is not available, use produit (same as OD)
    if (eye === 'left' && !productId) {
      productId = order.produit;
    }
    
    if (!productId) {
      return of('NA');
    }

    const cacheKey = `${productId}_${eye}`;

    if (!this.diameterCache[cacheKey]) {
      this.diameterCache[cacheKey] = this.stockService.getStockById(Number(productId)).pipe(
        map(stock => stock?.article_id),
        // If stock or article_id is missing, return 'NA'
        catchError(error => {
          console.error(`Error loading stock details for order ${order.order_id} (${eye} eye):`, error);
          return of(null);
        }),
        // Switch to fetching the article if article_id is present
        // Use switchMap only if article_id is present
        // Otherwise, return 'NA'
        switchMap(articleId => {
          if (articleId) {
            return this.articleService.getArticleById(articleId).pipe(
              map(article => article?.diametre?.toString() || 'NA'),
              catchError(error => {
                console.error(`Error loading article details for order ${order.order_id} (${eye} eye):`, error);
                return of('NA');
              })
            );
          } else {
            return of('NA');
          }
        }),
        shareReplay(1)
      );
    }

    return this.diameterCache[cacheKey];
  }

  getArticleName(order: Order, eye: 'right' | 'left' = 'right'): Observable<string> {
    // Use produit for right eye (OD), produit2 for left eye (OG)
    // If produit2 is not available for left eye, fall back to produit (same as OD)
    let productId = eye === 'right' ? order.produit : order.produit2;
    
    // If left eye and produit2 is not available, use produit (same as OD)
    if (eye === 'left' && !productId) {
      productId = order.produit;
    }
    
    if (!productId) {
      return of('NA');
    }

    const cacheKey = `article_${productId}_${eye}`;

    if (!this.articleNameCache[cacheKey]) {
      this.articleNameCache[cacheKey] = this.stockService.getStockById(Number(productId)).pipe(
        map(stock => stock?.article_id),
        // If stock or article_id is missing, return 'NA'
        catchError(error => {
          console.error(`Error loading stock details for article name (${eye} eye):`, error);
          return of(null);
        }),
        // Switch to fetching the article if article_id is present
        switchMap(articleId => {
          if (articleId) {
            return this.articleService.getArticleById(articleId).pipe(
              map(article => article?.libelle || 'NA'),
              catchError(error => {
                console.error(`Error loading article name for ${eye} eye:`, error);
                return of('NA');
              })
            );
          } else {
            return of('NA');
          }
        }),
        shareReplay(1)
      );
    }

    return this.articleNameCache[cacheKey];
  }

  printSingleTicket(order: Order, eye: 'right' | 'left' = 'right') {
    // Get the article name first, then generate and print the ticket
    this.getArticleName(order, eye).subscribe(articleName => {
      // Open a new window and print the ticket for the given order
      const printContents = this.generateTicketHtml(order, eye, articleName);
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Ticket</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;} .ticket-card{border:1px solid #ccc;padding:16px;margin:16px;} .ticket-header{font-weight:bold;} .ticket-table{margin-top:8px;} .ticket-table-header, .ticket-table-row{display:flex;gap:8px;} .ticket-table-header{font-weight:bold;}</style>');
        printWindow.document.write('</head><body >');
        printWindow.document.write(printContents);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    });
  }

  generateTicketHtml(order: Order, eye: 'right' | 'left' = 'right', articleName: string = ''): string {
    // Get the correct values based on the eye
    // For left eye, if OG values are not available, fall back to OD values
    let sphere, cylinder, axe, addition;
    
    if (eye === 'right') {
      sphere = order.od_sphere;
      cylinder = order.od_cylinder;
      axe = order.od_axe;
      addition = order.od_addition;
    } else {
      // Left eye: use OG values, fall back to OD values if OG is not available
      sphere = order.og_sphere || order.od_sphere;
      cylinder = order.og_cylinder || order.od_cylinder;
      axe = order.og_axe || order.od_axe;
      addition = order.og_addition || order.od_addition;
    }
    
    const eyeLabel = eye === 'right' ? 'D' : 'G';
    
    // Use the provided article name or fallback to static article_libelle
    const displayArticleName = articleName || order.article_libelle || 'NA';
    
    // Simple HTML for ticket, you can expand as needed
    return `
      <div class="ticket-card">
        <div class="ticket-header">Opticien: <span class="bold">${order.raison_social || ''}</span></div>
        <div>Porteur: <span class="bold italic">${order.first_name} ${order.last_name}</span></div>
        <div>verre ${eyeLabel}: <span class="bold">${displayArticleName}</span></div>
        <div>Date: ${order.order_datetime ? (new Date(order.order_datetime)).toLocaleDateString() : ''}</div>
        <div class="ticket-table">
          <div class="ticket-table-header">
            <span>Ø</span><span>SPH</span><span>CYL</span><span>AXE</span><span>ADD</span>
          </div>
          <div class="ticket-table-row">
            <span>?</span>
            <span>${sphere || '0.00'}</span>
            <span>${cylinder || '0.00'}</span>
            <span>${axe || '0'}</span>
            <span>${addition || '0.00'}</span>
          </div>
        </div>
        <div>Fournisseur: ${order.fournisseur_code || ''}</div>
      </div>
    `;
  }
} 