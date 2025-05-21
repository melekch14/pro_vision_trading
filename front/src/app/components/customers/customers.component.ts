import { Component, OnInit } from '@angular/core';
import { Customer } from '../../shared/models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  standalone: false
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery: string = '';
  sortBy: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private customerService: CustomerService,
    private router: Router
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
        this.filteredCustomers = [...this.customers];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.errorMessage = 'Failed to load customers';
        this.isLoading = false;
      }
    });
  }
  
  applyFilters(): void {
    let filtered = [...this.customers];
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.raison_social.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.codee.toLowerCase().includes(query) ||
        customer.responsable.toLowerCase().includes(query) ||
        customer.id.toString().includes(query)
      );
    }
    
    // Apply sorting
    this.sortCustomers(filtered);
    
    this.filteredCustomers = filtered;
  }
  
  sortCustomers(customers: Customer[]): void {
    customers.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortBy) {
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
    if (this.sortBy === field) {
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
  
  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
  
  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'id';
    this.sortDirection = 'asc';
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
  
  editCustomer(customer: Customer): void {
    this.router.navigate(['/app/customers', customer.id]);
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
} 