import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TicketsComponent implements OnInit {
  orders: Order[] = [];
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

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
    this.initializeGrid();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders.filter((order: Order) => order.status?.toLowerCase() === 'processing');
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

  getDiametre(order: Order): Observable<string> {
    if (!order.produit) {
      return of('NA');
    }

    const cacheKey = order.produit.toString();
    
    if (!this.diameterCache[cacheKey]) {
      this.diameterCache[cacheKey] = this.orderService.getArticleById(cacheKey).pipe(
        map(product => product?.diametre || 'NA'),
        catchError(error => {
          console.error(`Error loading product details for order ${order.order_id}:`, error);
          return of('NA');
        }),
        shareReplay(1)
      );
    }

    return this.diameterCache[cacheKey];
  }
} 