import { Component, OnInit } from '@angular/core';
import { OrderExportHistoryEntry, OrderExportHistoryService } from '../../services/order-export-history.service';

@Component({
  selector: 'app-order-export-history',
  templateUrl: './order-export-history.component.html',
  styleUrls: ['./order-export-history.component.css'],
  standalone: false
})
export class OrderExportHistoryComponent implements OnInit {
  history: OrderExportHistoryEntry[] = [];

  constructor(private historyService: OrderExportHistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.history = this.historyService.getHistory();
  }

  clearHistory(): void {
    if (!confirm('Voulez-vous vraiment supprimer tout l’historique des exports ?')) {
      return;
    }
    this.historyService.clear();
    this.loadHistory();
  }
}
