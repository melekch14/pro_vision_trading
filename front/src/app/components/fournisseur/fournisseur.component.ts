import { Component, OnInit } from '@angular/core';
import { FournisseurService } from '../../services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  // Filter and sort properties
  searchTerm: string = '';
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
      taux_retenue: [0]
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
    this.fournisseurService.getFournisseurs().subscribe(
      data => {
        this.fournisseurs = data;
        this.applyFilters();
      },
      error => console.error('Error loading fournisseurs:', error)
    );
  }

  // Filter and sort methods
  applyFilters(): void {
    this.filteredFournisseurs = this.fournisseurs.filter(fournisseur => {
      const matchesSearch = this.searchTerm === '' || 
        Object.values(fournisseur).some(value => 
          value?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      const matchesStatus = this.filterStatus === '' || 
        fournisseur.status?.toLowerCase() === this.filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    this.sortData();
  }

  sortData(): void {
    this.filteredFournisseurs.sort((a, b) => {
      const aValue = a[this.sortColumn as keyof Fournisseur];
      const bValue = b[this.sortColumn as keyof Fournisseur];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return this.sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  onSubmit(): void {
    if (this.fournisseurForm.valid) {
      const fournisseurData = this.fournisseurForm.value;
      
      if (this.isEditing && this.selectedFournisseur) {
        this.fournisseurService.updateFournisseur(this.selectedFournisseur.code, fournisseurData)
          .subscribe(
            () => {
              this.loadFournisseurs();
              this.resetForm();
              this.showForm = false;
            },
            error => console.error('Error updating fournisseur:', error)
          );
      } else {
        this.fournisseurService.createFournisseur(fournisseurData)
          .subscribe(
            () => {
              this.loadFournisseurs();
              this.resetForm();
              this.showForm = false;
            },
            error => console.error('Error creating fournisseur:', error)
          );
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
      this.fournisseurService.deleteFournisseur(code)
        .subscribe(
          () => {
            this.loadFournisseurs();
            this.resetForm();
          },
          error => console.error('Error deleting fournisseur:', error)
        );
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedFournisseur = null;
    this.fournisseurForm.reset();
  }

  // Get unique status values for filter dropdown
  getUniqueStatuses(): string[] {
    return [...new Set(this.fournisseurs.map(f => f.status))].filter(Boolean);
  }
} 