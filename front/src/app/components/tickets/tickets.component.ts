import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

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

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
    this.initializeGrid();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
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
      order: null
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
    if (cell.order) {
      this.draggedOrder = cell.order;
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
      // If dropping from list
      if (this.draggedFromList) {
        if (cell.order) {
          // If cell has an order, swap them
          const tempOrder = cell.order;
          cell.order = this.draggedOrder;
          // Remove the order from the list
          this.orders = this.orders.filter(o => o.id !== this.draggedOrder?.id);
          // Add the swapped order back to the list
          this.orders.push(tempOrder);
        } else {
          // If cell is empty, just place the order
          cell.order = this.draggedOrder;
          // Remove the order from the list
          this.orders = this.orders.filter(o => o.id !== this.draggedOrder?.id);
        }
      }
      // If dropping from another cell
      else if (this.draggedFromCell !== null) {
        const sourceCell = this.gridCells[this.draggedFromCell];
        if (cell.order) {
          // If target cell has an order, swap them
          const tempOrder = cell.order;
          cell.order = this.draggedOrder;
          sourceCell.order = tempOrder;
        } else {
          // If target cell is empty, move the order
          cell.order = this.draggedOrder;
          sourceCell.order = null;
        }
      }
    }

    this.draggedOrder = null;
    this.draggedFromCell = null;
    this.draggedFromList = false;
  }
} 