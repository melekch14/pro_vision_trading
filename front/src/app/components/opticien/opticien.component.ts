import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpticienService, Opticien, ComponentPermission } from '../../services/opticien.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

interface DisplayPermission {
  componentId: string;
  componentName: string;
  hasAccess: boolean;
}

@Component({
  selector: 'app-opticien',
  templateUrl: './opticien.component.html',
  styleUrls: ['./opticien.component.scss'],
  standalone: false
})
export class OpticienComponent implements OnInit {
  opticiens: Opticien[] = [];
  filteredOpticiens: Opticien[] = [];
  opticienForm: FormGroup;
  isEditing = false;
  showForm = false;
  selectedOpticienId: number | null = null;
  roles = ['administrateur', 'assistant'];

  // Loading and error states
  isLoading = false;
  errorMessage = '';

  // Search and filter properties
  searchCode = '';
  searchName = '';
  searchEmail = '';
  filterRole = '';

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Permissions management
  showPermissionsPanel = false;
  selectedOpticien: Opticien | null = null;
  availableComponents: DisplayPermission[] = [
    { componentId: 'dashboard', componentName: 'Dashboard', hasAccess: false },
    { componentId: 'article-manager', componentName: 'Article Manager', hasAccess: false },
    { componentId: 'article-hierarchy', componentName: 'Article Hierarchy', hasAccess: false },
    { componentId: 'article-params', componentName: 'Article Parameters', hasAccess: false },
    { componentId: 'tickets', componentName: 'Tickets', hasAccess: false },
    { componentId: 'orders', componentName: 'Orders', hasAccess: false },
    { componentId: 'customers', componentName: 'Customers', hasAccess: false },
    { componentId: 'fournisseurs', componentName: 'Suppliers', hasAccess: false },
    { componentId: 'opticiens', componentName: 'Opticien Management', hasAccess: false },
    { componentId: 'activity-history', componentName: 'Historique des activités', hasAccess: false },
    { componentId: 'profile-update-requests', componentName: 'Demandes de modification', hasAccess: false },
    { componentId: 'bl', componentName: 'Bon de Livraison', hasAccess: false },
    { componentId: 'settings', componentName: 'Paramètres', hasAccess: false },
  ];

  constructor(
    private opticienService: OpticienService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public themeService: ThemeService,
    private authService: AuthService
  ) {
    this.opticienForm = this.fb.group({
      codee: ['', Validators.required],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOpticiens();
  }

  loadOpticiens(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.opticienService.getAllOpticiens().subscribe({
      next: (data) => {
        this.opticiens = data;
        this.filteredOpticiens = [...data];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la chargement des opticiens';
        this.isLoading = false;
        this.showMessage('Erreur lors de la chargement des opticiens');
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  applyFilters(): void {
    this.filteredOpticiens = this.opticiens.filter(opticien => {
      const matchesCode = !this.searchCode ||
        opticien.codee.toLowerCase().includes(this.searchCode.toLowerCase());
      const matchesName = !this.searchName ||
        (opticien.nom.toLowerCase().includes(this.searchName.toLowerCase()) ||
         opticien.prenom.toLowerCase().includes(this.searchName.toLowerCase()));
      const matchesEmail = !this.searchEmail ||
        opticien.email.toLowerCase().includes(this.searchEmail.toLowerCase());
      const matchesRole = !this.filterRole || opticien.role === this.filterRole;

      return matchesCode && matchesName && matchesEmail && matchesRole;
    });
  }

  resetFilters(): void {
    this.searchCode = '';
    this.searchName = '';
    this.searchEmail = '';
    this.filterRole = '';
    this.filteredOpticiens = [...this.opticiens];
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredOpticiens.sort((a, b) => {
      const aValue = (a as any)[column];
      const bValue = (b as any)[column];

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  exportToCSV(): void {
    const csvData = this.filteredOpticiens.map(opticien => ({
      Code: opticien.codee,
      'Last Name': opticien.nom,
      'First Name': opticien.prenom,
      Email: opticien.email,
      Role: opticien.role
    }));

    const csvContent = this.convertToCSV(csvData);
    this.downloadFile(csvContent, 'opticiens.csv', 'text/csv');
  }

  exportToPDF(): void {
    // For now, just show a message. You can implement PDF export later
    this.showMessage('PDF export feature will be implemented soon');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private downloadFile(content: string, fileName: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onSubmit(): void {
    if (this.opticienForm.valid) {
      const opticienData = this.opticienForm.value;

      if (this.isEditing && this.selectedOpticienId) {
        this.opticienService.updateOpticien(this.selectedOpticienId, opticienData).subscribe({
          next: () => {
            this.showMessage('Opticien mis à jour avec succès');
            this.resetForm();
            this.loadOpticiens();
          },
          error: (error) => {
            this.showMessage('Erreur lors de la mise à jour de l\'opticien');
          }
        });
      } else {
        this.opticienService.createOpticien(opticienData).subscribe({
          next: () => {
            this.showMessage('Opticien créé avec succès');
            this.resetForm();
            this.loadOpticiens();
          },
          error: (error) => {
            this.showMessage('Erreur lors de la création de l\'opticien');
          }
        });
      }
    }
  }

  editOpticien(opticien: Opticien): void {
    this.isEditing = true;
    this.showForm = true;
    this.selectedOpticienId = opticien.id!;
    this.opticienForm.patchValue({
      codee: opticien.codee,
      nom: opticien.nom,
      prenom: opticien.prenom,
      email: opticien.email,
      role: opticien.role
    });
    // Don't set password when editing
    this.opticienForm.get('password')?.clearValidators();
    this.opticienForm.get('password')?.updateValueAndValidity();
  }

  deleteOpticien(id: number): void {
    if (confirm('Are you sure you want to delete this opticien?')) {
      this.opticienService.deleteOpticien(id).subscribe({
        next: () => {
          this.showMessage('Opticien supprimé avec succès');
          this.loadOpticiens();
        },
        error: (error) => {
          this.showMessage('Erreur lors de la suppression de l\'opticien');
        }
      });
    }
  }

  resetForm(): void {
    this.opticienForm.reset();
    this.isEditing = false;
    this.showForm = false;
    this.selectedOpticienId = null;
    this.opticienForm.get('password')?.setValidators([Validators.required]);
    this.opticienForm.get('password')?.updateValueAndValidity();
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  openPermissionsPanel(opticien: Opticien): void {
    if (this.authService.getUserData()?.role !== 'administrateur') {
      this.showMessage('Seuls les administrateurs peuvent gérer les permissions');
      return;
    }

    if (opticien.role !== 'assistant') {
      this.showMessage('Les permissions ne peuvent être gérées que pour les assistants');
      return;
    }

    this.selectedOpticien = opticien;
    this.showPermissionsPanel = true;
    this.loadOpticienPermissions(opticien.id!);
  }

  loadOpticienPermissions(opticienId: number): void {
    this.opticienService.getOpticienPermissions(opticienId).subscribe({
      next: (permissions) => {
        console.log('Received permissions:', permissions);
        // Update the available components with the current permissions
        this.availableComponents = this.availableComponents.map(comp => {
          const existingPermission = permissions.find(p => p.component_id === comp.componentId);
          return {
            ...comp,
            hasAccess: existingPermission ? existingPermission.has_access : false
          };
        });
        console.log('Updated components:', this.availableComponents);
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.showMessage('Erreur lors de la chargement des permissions');
      }
    });
  }

  savePermissions(): void {
    if (!this.selectedOpticien?.id) return;

    const permissionsToSave = this.availableComponents.map(comp => ({
      component_id: comp.componentId,
      has_access: comp.hasAccess
    }));

    console.log('Saving permissions:', permissionsToSave); // Debug log

    this.opticienService.updateOpticienPermissions(
      this.selectedOpticien.id,
      permissionsToSave
    ).subscribe({
      next: () => {
        this.showMessage('Permissions mises à jour avec succès');
        this.closePermissionsPanel();
      },
      error: (error) => {
        console.error('Error updating permissions:', error);
        this.showMessage('Erreur lors de la mise à jour des permissions');
      }
    });
  }

  closePermissionsPanel(): void {
    this.showPermissionsPanel = false;
    this.selectedOpticien = null;
    this.availableComponents = this.availableComponents.map(comp => ({
      ...comp,
      hasAccess: false
    }));
  }

  toggleComponentAccess(component: DisplayPermission): void {
    component.hasAccess = !component.hasAccess;
  }
}
