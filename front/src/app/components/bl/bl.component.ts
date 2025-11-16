import { Component, OnInit } from '@angular/core';
import { BlService } from '../../services/bl.service';
import { Bl, BlStatistics } from '../../models/bl.model';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { BlImportModalComponent } from './bl-import-modal/bl-import-modal.component';
import { BlDetailsModalComponent } from './bl-details-modal/bl-details-modal.component';

@Component({
  selector: 'app-bl',
  templateUrl: './bl.component.html',
  styleUrls: ['./bl.component.scss'],
  standalone: false
})
export class BlComponent implements OnInit {
  blRecords: Bl[] = [];
  filteredBlRecords: Bl[] = [];
  loading: boolean = true;
  error: string | null = null;
  statistics: BlStatistics | null = null;

  // Pagination properties
  pageSize: number = 10;
  pageIndex: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Filter states
  searchQuery: string = '';
  dateFilter: string = '';
  userFilter: string = '';

  // Table columns
  displayedColumns: string[] = [
    'numero',
    'date',
    'code_tier',
    'nom_raison_social',
    'total_ttc',
    'mode_paie',
    'user_create',
    'reste',
    'actions'
  ];

  constructor(
    private blService: BlService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBlRecords();
    this.loadStatistics();
  }

  loadBlRecords(): void {
    this.loading = true;
    this.error = null;

    this.blService.getAllBl().subscribe({
      next: (response: Bl[]) => {
        this.blRecords = response;
        this.filteredBlRecords = [...this.blRecords];
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load BL records. Please try again later.';
        this.loading = false;
        console.error('Error loading BL records:', error);
      }
    });
  }

  loadStatistics(): void {
    this.blService.getBlStatistics().subscribe({
      next: (response: any) => {
        // Handle both direct response and wrapped response
        this.statistics = response.data || response;
      },
      error: (error: any) => {
        console.error('Error loading BL statistics:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.blRecords];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(record =>
        record.numero.toLowerCase().includes(query) ||
        record.nom_raison_social.toLowerCase().includes(query) ||
        record.code_tier.toLowerCase().includes(query) ||
        record.user_create.toLowerCase().includes(query)
      );
    }

    if (this.dateFilter) {
      const filterDate = new Date(this.dateFilter);
      filtered = filtered.filter(record =>
        record.date && new Date(record.date).toDateString() === filterDate.toDateString()
      );
    }

    if (this.userFilter) {
      filtered = filtered.filter(record =>
        record.user_create.toLowerCase().includes(this.userFilter.toLowerCase())
      );
    }

    this.filteredBlRecords = filtered;
    this.pageIndex = 0; // Reset to first page when filters change
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.dateFilter = '';
    this.userFilter = '';
    this.filteredBlRecords = [...this.blRecords];
    this.pageIndex = 0; // Reset to first page when filters are reset
  }

  openImportModal(): void {
    const dialogRef = this.dialog.open(BlImportModalComponent, {
      width: '600px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadBlRecords();
        this.loadStatistics();
      }
    });
  }

  openBlDetails(blRecord: Bl): void {
    const dialogRef = this.dialog.open(BlDetailsModalComponent, {
      data: blRecord,
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadBlRecords();
        this.loadStatistics();
      }
    });
  }

  deleteBl(blRecord: Bl): void {
    if (confirm(`Are you sure you want to delete BL record ${blRecord.numero}?`)) {
      this.blService.deleteBl(blRecord.id.toString()).subscribe({
        next: () => {
          this.loadBlRecords();
          this.loadStatistics();
        },
        error: (error: any) => {
          console.error('Error deleting BL record:', error);
          alert('Failed to delete BL record. Please try again.');
        }
      });
    }
  }

  exportBlRecords(): void {
    const headers = 'Numero,Date,Code Tier,Nom/Raison Social,Total TTC,Mode Paie,Observation,User Create,Totreg,Deja Recu,Reste\n';
    const rows = this.filteredBlRecords.map(record => {
      const date = record.date ? new Date(record.date).toISOString().split('T')[0] : '';
      return `${record.numero},"${date}",${record.code_tier},"${record.nom_raison_social}",${record.total_ttc || 0},"${record.mode_paie || ''}","${record.observation || ''}",${record.user_create},${record.totreg || 0},${record.deja_recu || 0},${record.reste || 0}`;
    }).join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bl_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  formatCurrency(amount: number): string {
    return amount ? amount.toLocaleString('fr-FR') + ' CFA' : '0 CFA';
  }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }

  trackByBlId(index: number, blRecord: Bl): number {
    return blRecord.id;
  }

  // Add pagination event handler
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  // Get current page data
  getCurrentPageData(): Bl[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredBlRecords.slice(startIndex, startIndex + this.pageSize);
  }
}

