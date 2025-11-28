import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FournisseurService } from '../../services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

@Component({
  selector: 'app-fournisseur',
  templateUrl: './fournisseur.component.html',
  styleUrls: ['./fournisseur.component.scss'],
  standalone: false
})
export class FournisseurComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  filteredFournisseurs: Fournisseur[] = [];
  fournisseurForm: FormGroup;
  isEditing = false;
  selectedFournisseur: Fournisseur | null = null;
  showForm = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  importSuccess: string | null = null;
  importError: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  // Filter and sort properties
  searchCode: string = '';
  searchCompany: string = '';
  searchEmail: string = '';
  sortColumn: string = 'code';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterStatus: string = '';

  constructor(
    private fournisseurService: FournisseurService,
    private fb: FormBuilder
  ) {
    this.fournisseurForm = this.fb.group({
      code: ['', Validators.required],
      raison_social: ['', Validators.required],
      adresse: [''],
      mat_vin: [''],
      tel: [''],
      fax: [''],
      email: ['', Validators.email],
      responsable: [''],
      id_fiscale: [''],
      banque: [''],
      agence: [''],
      rib: [''],
      categorie_prix_vente: [''],
      status: [''],
      activite_economique: [''],
      remise: [0],
      taux_retenue: [0],
      rccm: [''],
      ninea: [''],
      code_douane: ['']
    });
  }

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  loadFournisseurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fournisseurService.getFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.filteredFournisseurs = [...this.fournisseurs];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading fournisseurs:', error);
        this.errorMessage = 'Échec du chargement des fournisseurs';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.fournisseurs];

    // Apply code filter
    if (this.searchCode.trim()) {
      const query = this.searchCode.toLowerCase().trim();
      filtered = filtered.filter(fournisseur =>
        fournisseur.code.toLowerCase().includes(query)
      );
    }

    // Apply company name filter
    if (this.searchCompany.trim()) {
      const query = this.searchCompany.toLowerCase().trim();
      filtered = filtered.filter(fournisseur =>
        fournisseur.raison_social.toLowerCase().includes(query)
      );
    }

    // Apply email filter
    if (this.searchEmail.trim()) {
      const query = this.searchEmail.toLowerCase().trim();
      filtered = filtered.filter(fournisseur =>
        fournisseur.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.filterStatus) {
      filtered = filtered.filter(fournisseur =>
        fournisseur.status.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }

    // Apply sorting
    this.sortData(filtered);

    this.filteredFournisseurs = filtered;
  }

  sortData(data: Fournisseur[]): void {
    data.sort((a, b) => {
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
        case 'tel':
          valueA = a.tel;
          valueB = b.tel;
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
          valueA = a.code;
          valueB = b.code;
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

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters(): void {
    this.searchCode = '';
    this.searchCompany = '';
    this.searchEmail = '';
    this.filterStatus = '';
    this.sortColumn = 'code';
    this.sortDirection = 'asc';
    this.filteredFournisseurs = [...this.fournisseurs];
  }

  exportToCSV(): void {
    const data = this.filteredFournisseurs.map(fournisseur => ({
      Code: fournisseur.code,
      'Company Name': fournisseur.raison_social,
      Email: fournisseur.email,
      Phone: fournisseur.tel,
      Responsible: fournisseur.responsable,
      Status: fournisseur.status,
      Address: fournisseur.adresse
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Suppliers': worksheet }, SheetNames: ['Suppliers'] };
    XLSX.writeFile(workbook, 'suppliers_report.csv');
  }

  exportToPDF(): void {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Suppliers Report', 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const tableData = this.filteredFournisseurs.map(fournisseur => [
      fournisseur.code,
      fournisseur.raison_social,
      fournisseur.email,
      fournisseur.tel,
      fournisseur.responsable,
      fournisseur.status,
      fournisseur.adresse
    ]);

    // Add table
    const options: UserOptions = {
      head: [['Code', 'Company Name', 'Email', 'Phone', 'Responsible', 'Status', 'Address']],
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
    doc.save('suppliers_report.pdf');
  }

  onSubmit(): void {
    if (this.fournisseurForm.valid) {
      const fournisseurData = this.fournisseurForm.value;

      if (this.isEditing && this.selectedFournisseur) {
        this.fournisseurService.updateFournisseur(this.selectedFournisseur.code, fournisseurData)
          .subscribe({
            next: () => {
              this.loadFournisseurs();
              this.resetForm();
              this.showForm = false;
            },
            error: (error) => {
              console.error('Error updating fournisseur:', error);
              this.errorMessage = 'Échec de la mise à jour du fournisseur';
            }
          });
      } else {
        this.fournisseurService.createFournisseur(fournisseurData)
          .subscribe({
            next: () => {
              this.loadFournisseurs();
              this.resetForm();
              this.showForm = false;
            },
            error: (error) => {
              console.error('Error creating fournisseur:', error);
              this.errorMessage = 'Échec de la création du fournisseur';
            }
          });
      }
    }
  }

  editFournisseur(fournisseur: Fournisseur): void {
    this.isEditing = true;
    this.selectedFournisseur = fournisseur;
    this.fournisseurForm.patchValue(fournisseur);
    this.showForm = true;
  }

  deleteFournisseur(code: string): void {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.isLoading = true;
      this.errorMessage = '';

      this.fournisseurService.deleteFournisseur(code)
        .subscribe({
          next: () => {
            this.loadFournisseurs();
            this.resetForm();
          },
          error: (error) => {
            console.error('Error deleting fournisseur:', error);
            this.errorMessage = 'Échec de la suppression du fournisseur';
            this.isLoading = false;
          }
        });
    }
  }

  resetForm(): void {
    this.fournisseurForm.reset();
    this.isEditing = false;
    this.selectedFournisseur = null;
  }

  getUniqueStatuses(): string[] {
    return [...new Set(this.fournisseurs.map(f => f.status))].filter(Boolean);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      this.importError = 'Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)';
      this.importSuccess = null;
      return;
    }

    this.importError = null;
    this.importSuccess = null;
    this.isLoading = true;

    const formData = new FormData();
    formData.append('file', file);

    this.fournisseurService.importFournisseursFromExcel(formData).subscribe({
      next: (result) => {
        let message = `Import réussi: ${result.importedCount} enregistrement(s) importé(s) sur ${result.totalRecords}`;
        if (result.errors && result.errors.length > 0) {
          message += `, ${result.errors.length} erreur(s)`;
        }
        this.importSuccess = message;
        this.importError = null;
        this.isLoading = false;
        this.loadFournisseurs();
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      },
      error: (error) => {
        this.importError = error.error?.message || 'Erreur lors de l\'importation du fichier';
        this.importSuccess = null;
        this.isLoading = false;
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    });
  }

  downloadTemplate(): void {
    // Create a sample Excel template for fournisseur import
    const templateData = [
      ['code', 'raison_social', 'adresse', 'mat_vin', 'tel', 'fax', 'email', 'responsable', 'id_fiscale', 'banque', 'agence', 'rib', 'categorie_prix_vente', 'status', 'activite_economique', 'remise', 'taux_retenue', 'rccm', 'ninea', 'code_douane'],
      ['F001', 'Fournisseur Exemple 1', '123 Rue Exemple', 'MAT001', '771234567', '771234568', 'fournisseur1@example.com', 'Responsable 1', 'ID001', 'Banque 1', 'Agence 1', 'RIB001', 'Cat1', 'actif', 'Commerce', 0, 0, 'RCCM001', 'NINEA001', 'CD001'],
      ['F002', 'Fournisseur Exemple 2', '456 Avenue Test', 'MAT002', '772345678', '772345679', 'fournisseur2@example.com', 'Responsable 2', 'ID002', 'Banque 2', 'Agence 2', 'RIB002', 'Cat2', 'actif', 'Industrie', 5, 2, 'RCCM002', 'NINEA002', 'CD002']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fournisseurs');
    XLSX.writeFile(wb, 'modele_import_fournisseurs.xlsx');
  }
} 