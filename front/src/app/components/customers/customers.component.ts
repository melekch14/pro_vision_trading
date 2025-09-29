import { Component, OnInit } from '@angular/core';
import { Customer } from '../../shared/models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { MatDialog } from '@angular/material/dialog';
import { CustomerDetailsModalComponent } from './customer-details-modal.component';
import { CustomerImportModalComponent } from './customer-import-modal/customer-import-modal.component';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  standalone: false
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchCode: string = '';
  searchCompany: string = '';
  searchEmail: string = '';
  searchResponsable: string = '';
  sortColumn: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPendingOnly: boolean = false;
  pendingCount: number = 0;
  showForm: boolean = false;
  editingCustomer: Customer | null = null;
  
  constructor(
    private customerService: CustomerService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadCustomers();
  }
  
  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.updatePendingCount();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.errorMessage = 'Failed to load customers';
        this.isLoading = false;
      }
    });
  }
  
  updatePendingCount(): void {
    this.pendingCount = this.customers.filter(c => c.status === 'pending').length;
  }
  
  applyFilters(): void {
    let filtered = [...this.customers];
    
    if (this.showPendingOnly) {
      filtered = filtered.filter(customer => customer.status === 'pending');
    } else {
      filtered = filtered.filter(customer => customer.status === 'active');
    }
    this.updatePendingCount();
    
    // Apply code filter
    if (this.searchCode.trim()) {
      const query = this.searchCode.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.codee.toLowerCase().includes(query)
      );
    }
    
    // Apply company name filter
    if (this.searchCompany.trim()) {
      const query = this.searchCompany.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.raison_social.toLowerCase().includes(query)
      );
    }
    
    // Apply email filter
    if (this.searchEmail.trim()) {
      const query = this.searchEmail.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.email.toLowerCase().includes(query)
      );
    }
    
    // Apply responsable filter
    if (this.searchResponsable.trim()) {
      const query = this.searchResponsable.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.responsable.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    this.sortCustomers(filtered);
    
    this.filteredCustomers = filtered;
  }
  
  sortCustomers(customers: Customer[]): void {
    customers.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortColumn) {
        case 'raison_social':
          valueA = a.raison_social;
          valueB = b.raison_social;
          break;
        case 'email':
          valueA = a.email;
          valueB = b.email;
          break;
        case 'responsable':
          valueA = a.responsable;
          valueB = b.responsable;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a.id;
          valueB = b.id;
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  setSortBy(field: string): void {
    if (this.sortColumn === field) {
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
  
  getSortIcon(field: string): string {
    if (this.sortColumn !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
  
  resetFilters(): void {
    this.searchCode = '';
    this.searchCompany = '';
    this.searchEmail = '';
    this.searchResponsable = '';
    this.sortColumn = 'id';
    this.sortDirection = 'asc';
    this.showPendingOnly = false;
    this.filteredCustomers = [...this.customers];
  }

  exportToCSV(): void {
    const data = this.filteredCustomers.map(customer => ({
      ID: customer.id,
      Code: customer.codee,
      'Raison Social': customer.raison_social,
      Email: customer.email,
      Responsable: customer.responsable,
      Tel: customer.tel,
      Status: customer.status,
      Adresse: customer.adresse
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Customers': worksheet }, SheetNames: ['Customers'] };
    XLSX.writeFile(workbook, 'customers_report.csv');
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Customers Report', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const tableData = this.filteredCustomers.map(customer => [
      customer.id.toString(),
      customer.codee,
      customer.raison_social,
      customer.email,
      customer.responsable,
      customer.tel,
      customer.status,
      customer.adresse
    ]);

    // Add table
    const options: UserOptions = {
      head: [['ID', 'Code', 'Raison Social', 'Email', 'Responsable', 'Tel', 'Status', 'Adresse']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255
      }
    };

    (doc as any).autoTable(options);
    doc.save('customers_report.pdf');
  }

  openImportModal(): void {
    const dialogRef = this.dialog.open(CustomerImportModalComponent, {
      width: '600px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadCustomers();
      }
    });
  }
  
  editCustomer(customer: Customer): void {
    this.editingCustomer = { ...customer };
    this.showForm = true;
  }

  openAddCustomerForm(): void {
    this.editingCustomer = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCustomer = null;
    this.loadCustomers(); // Refresh list after add/edit
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== id);
          this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== id);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.errorMessage = 'Failed to delete customer';
          this.isLoading = false;
        }
      });
    }
  }

  togglePendingRequests(): void {
    this.showPendingOnly = !this.showPendingOnly;
    this.applyFilters();
  }

  approveCustomer(customer: Customer): void {
    this.customerService.updateCustomerStatus(customer.id, 'active').subscribe({
      next: () => {
        customer.status = 'active';
        this.applyFilters();
      },
      error: (error) => {
        alert('Failed to approve customer: ' + (error.error?.message || error.message));
      }
    });
  }

  rejectCustomer(customer: Customer): void {
    this.customerService.updateCustomerStatus(customer.id, 'inactive').subscribe({
      next: () => {
        customer.status = 'inactive';
        this.applyFilters();
      },
      error: (error) => {
        alert('Failed to reject customer: ' + (error.error?.message || error.message));
      }
    });
  }

  openCustomerDetailsDialog(customer: Customer): void {
    const dialogRef = this.dialog.open(CustomerDetailsModalComponent, {
      width: '700px',
      maxHeight: '80vh',
      position: { top: '20px' },
      data: { customer },
      panelClass: 'customer-details-modal',
      autoFocus: false,
      restoreFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'approved') {
        this.approveCustomer(customer);
      } else if (result === 'rejected') {
        this.rejectCustomer(customer);
      }
    });
  }
} 