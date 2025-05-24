import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArticleService, Article } from '../../services/article.service';
import { ArticleParamsService } from '../../services/article-params.service';
import { ArticleHierarchyService } from '../../shared/services/article-hierarchy.service';
import { ArticleSubfamily } from '../../shared/models/article-hierarchy.model';
import { StockDialogComponent } from './stock-dialog/stock-dialog.component';
import { StockService, StockEntryWithArticle, StockEntry as ApiStockEntry } from '../../services/stock.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

interface DialogStockEntry {
  sphere: number;
  cylindre: number;
  quantite: number;
}

@Component({
  selector: 'app-article-manager',
  templateUrl: './article-manager.component.html',
  styleUrls: ['./article-manager.component.scss'],
  standalone: false
})
export class ArticleManagerComponent implements OnInit {
  articleForm: FormGroup;
  filterForm: FormGroup;
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  
  // Options from services
  foyerOptions: any[] = [];
  indiceOptions: any[] = [];
  designOptions: any[] = [];
  couleurPhotoOptions: any[] = [];
  traitementOptions: any[] = [];
  fournisseurOptions: any[] = [];
  typeArticleOptions: any[] = [];
  subfamilyOptions: ArticleSubfamily[] = [];
  
  // Tab state
  activeTab: 'browse' | 'add' | 'stock' = 'browse';
  editingArticle: Article | null = null;

  // Stock management
  sphereValues: number[] = Array.from({length: 33}, (_, i) => -4 + (i * 0.25));
  cylindreValues: number[] = Array.from({length: 9}, (_, i) => -2 + (i * 0.25));
  dialogStockEntries: DialogStockEntry[] = [];

  // Stock panel properties
  stockEntries: StockEntryWithArticle[] = [];
  filteredStockEntries: StockEntryWithArticle[] = [];
  displayedColumns: string[] = ['code', 'libelle', 'qte', 'sphere', 'cylindre', 'addition'];
  
  stockFilters = {
    code: '',
    libelle: '',
    quantity: '',
    sphere: '',
    cylindre: '',
    addition: ''
  };

  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string | null = null;

  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private articleParamsService: ArticleParamsService,
    private articleHierarchyService: ArticleHierarchyService,
    private stockService: StockService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.articleForm = this.fb.group({
      article_subfamily_id: ['', Validators.required],
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      diametre: ['', [Validators.required, Validators.min(0)]],
      foyer_id: ['', Validators.required],
      indice_id: ['', Validators.required],
      design_id: ['', Validators.required],
      couleur_photo_id: ['', Validators.required],
      traitement_id: ['', Validators.required],
      prix_achat: ['', [Validators.required, Validators.min(0)]],
      tva: [18, [Validators.required, Validators.min(0)]],
      prix_vente: ['', [Validators.required, Validators.min(0)]],
      code_a_barre: ['', Validators.required],
      expiration: ['', Validators.required],
      fournisseur_id: ['', Validators.required],
      typeArticle_id: ['', Validators.required],
      type_stock: ['', Validators.required]
    });

    // Subscribe to subfamily changes
    this.articleForm.get('article_subfamily_id')?.valueChanges.subscribe(subfamilyId => {
      if (subfamilyId) {
        const selectedSubfamily = this.subfamilyOptions.find(sf => sf.id === Number(subfamilyId));
        if (selectedSubfamily) {
          this.articleForm.patchValue({
            code: selectedSubfamily.code,
            libelle: selectedSubfamily.name
          }, { emitEvent: false }); // Prevent infinite loop
        }
      }
    });

    // Subscribe to prix_achat changes to calculate prix_vente
    this.articleForm.get('prix_achat')?.valueChanges.subscribe(prixAchat => {
      if (prixAchat) {
        const tva = 18; // Fixed TVA at 18%
        const prixVente = prixAchat * (1 + tva/100);
        this.articleForm.patchValue({
          prix_vente: prixVente.toFixed(2)
        }, { emitEvent: false });
      }
    });

    // Ensure TVA is always set to 18
    this.articleForm.get('tva')?.setValue(18);

    this.filterForm = this.fb.group({
      code: [''],
      libelle: [''],
      fournisseur: ['']
    });

    // Initialize stock entries
    this.initializeStockEntries();
  }

  ngOnInit(): void {
    this.loadArticles();
    this.loadOptions();
    this.loadStockEntries();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Set initial TVA value
    this.setTvaValue();
  }

  private initializeStockEntries(): void {
    this.dialogStockEntries = [];
    this.sphereValues.forEach(sphere => {
      this.cylindreValues.forEach(cylindre => {
        this.dialogStockEntries.push({
          sphere,
          cylindre,
          quantite: 0
        });
      });
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.articleService.getArticles().subscribe({
      next: (data) => {
        this.articles = data;
        this.applyFilters();
        this.isLoading = false;
        // Refresh stock table after loading articles
        this.loadStockEntries();
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.errorMessage = 'Failed to load articles';
        this.isLoading = false;
      }
    });
  }

  loadOptions(): void {
    // Load foyers
    this.articleParamsService.getParams('foyers').subscribe({
      next: (params) => this.foyerOptions = params,
      error: (error) => console.error('Error loading foyers:', error)
    });

    // Load indices
    this.articleParamsService.getParams('indices').subscribe({
      next: (params) => this.indiceOptions = params,
      error: (error) => console.error('Error loading indices:', error)
    });

    // Load designs
    this.articleParamsService.getParams('designs').subscribe({
      next: (params) => this.designOptions = params,
      error: (error) => console.error('Error loading designs:', error)
    });

    // Load couleur photos
    this.articleParamsService.getParams('couleur-photos').subscribe({
      next: (params) => this.couleurPhotoOptions = params,
      error: (error) => console.error('Error loading couleur photos:', error)
    });

    // Load traitements
    this.articleParamsService.getParams('traitements').subscribe({
      next: (params) => this.traitementOptions = params,
      error: (error) => console.error('Error loading traitements:', error)
    });

    // Load type articles
    this.articleParamsService.getParams('type-articles').subscribe({
      next: (params) => this.typeArticleOptions = params,
      error: (error) => console.error('Error loading type articles:', error)
    });

    // Load fournisseurs
    this.articleParamsService.getFournisseurs().subscribe({
      next: (fournisseurs) => this.fournisseurOptions = fournisseurs,
      error: (error) => console.error('Error loading fournisseurs:', error)
    });

    // Load subfamilies
    this.articleHierarchyService.getSubfamilies().subscribe({
      next: (subfamilies) => this.subfamilyOptions = subfamilies,
      error: (error) => console.error('Error loading subfamilies:', error)
    });
  }

  loadStockEntries(): void {
    this.stockService.getAllStockWithArticles().subscribe({
      next: (data: StockEntryWithArticle[]) => {
        this.stockEntries = data;
        this.applyStockFilters();
      },
      error: (error) => {
        console.error('Error loading stock entries:', error);
        this.snackBar.open('Error loading stock entries', 'Close', { duration: 3000 });
      }
    });
  }

  formatStockCode(entry: StockEntryWithArticle): string {
    const cyl = entry.cylindre !== null ? entry.cylindre.toString().padStart(4, '0') : 
               (entry.addition !== null ? entry.addition.toString().padStart(4, '0') : '0000');
    const sph = entry.sphere.toString().padStart(4, '0');
    return `${entry.subfamily_code} - (${cyl}) - ${sph}`;
  }

  formatStockLibelle(entry: StockEntryWithArticle): string {
    const cyl = entry.cylindre !== null ? entry.cylindre.toString().padStart(4, '0') : 
               (entry.addition !== null ? entry.addition.toString().padStart(4, '0') : '0000');
    const sph = entry.sphere.toString().padStart(4, '0');
    return `${entry.article_libelle} (${cyl}) - ${sph}`;
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      const articleData = this.articleForm.value;
      
      if (this.editingArticle) {
        this.articleService.updateArticle(this.editingArticle.id!, articleData).subscribe({
          next: () => {
            this.snackBar.open('Article updated successfully', 'Close', { duration: 3000 });
            this.loadArticles();
            this.setTab('browse');
            // Refresh stock table after updating article
            this.loadStockEntries();
          },
          error: (error) => {
            console.error('Error updating article:', error);
            this.snackBar.open('Error updating article', 'Close', { duration: 3000 });
          }
        });
      } else {
        this.articleService.createArticle(articleData).subscribe({
          next: () => {
            this.snackBar.open('Article created successfully', 'Close', { duration: 3000 });
            this.loadArticles();
            this.setTab('browse');
            // Refresh stock table after creating article
            this.loadStockEntries();
          },
          error: (error) => {
            console.error('Error creating article:', error);
            this.snackBar.open('Error creating article', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  editArticle(article: Article): void {
    this.editingArticle = article;
    this.articleForm.patchValue(article);
    // Ensure TVA is set to 18 even when editing
    this.setTvaValue();
    this.setTab('add');
  }

  deleteArticle(id: number): void {
    if (confirm('Are you sure you want to delete this article?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.snackBar.open('Article deleted successfully', 'Close', { duration: 3000 });
          this.loadArticles();
          // Refresh stock table after deleting article
          this.loadStockEntries();
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          this.snackBar.open('Error deleting article', 'Close', { duration: 3000 });
        }
      });
    }
  }

  resetForm(): void {
    this.articleForm.reset();
    // Ensure TVA is set to 18 after reset
    this.setTvaValue();
    this.editingArticle = null;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredArticles = this.articles.filter(article => {
      return (
        (!filters.code || article.code.toLowerCase().includes(filters.code.toLowerCase())) &&
        (!filters.libelle || article.libelle.toLowerCase().includes(filters.libelle.toLowerCase())) &&
        (!filters.fournisseur || article.fournisseur_id === filters.fournisseur)
      );
    });

    // Reapply sorting if active
    if (this.sortColumn) {
      this.onSort(this.sortColumn);
    }
  }

  openStockDialog(article: Article): void {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      width: '800px',
      data: { article }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
        const promises: Promise<any>[] = [];

        // Handle updates
        if (result.updates && result.updates.length > 0) {
          console.log('Processing updates:', result.updates);
          result.updates.forEach((entry: ApiStockEntry) => {
            console.log('Updating entry with data:', {
              id: entry.id,
              article_id: entry.article_id,
              sphere: entry.sphere,
              cylindre: entry.cylindre,
              quantite: entry.quantite
            });
            
            const updatePromise = this.stockService.updateStock(entry.id!, entry)
              .toPromise()
              .then(response => {
                console.log('Update successful:', response);
                return response;
              })
              .catch(error => {
                console.error('Update failed:', error);
                console.error('Error details:', {
                  status: error.status,
                  statusText: error.statusText,
                  error: error.error
                });
                throw error;
              });
            
            promises.push(updatePromise);
          });
        } else {
          console.log('No updates to process');
        }

        // Handle insertions
        if (result.insertions && result.insertions.length > 0) {
          console.log('Processing insertions:', result.insertions);
          result.insertions.forEach((entry: ApiStockEntry) => {
            console.log('Inserting entry with data:', {
              article_id: entry.article_id,
              sphere: entry.sphere,
              cylindre: entry.cylindre,
              quantite: entry.quantite
            });
            
            const insertPromise = this.stockService.createStock(entry)
              .toPromise()
              .then(response => {
                console.log('Insert successful:', response);
                return response;
              })
              .catch(error => {
                console.error('Insert failed:', error);
                console.error('Error details:', {
                  status: error.status,
                  statusText: error.statusText,
                  error: error.error
                });
                throw error;
              });
            
            promises.push(insertPromise);
          });
        } else {
          console.log('No insertions to process');
        }

        // Handle deletions
        if (result.deletions && result.deletions.length > 0) {
          console.log('Processing deletions:', result.deletions);
          result.deletions.forEach((entry: ApiStockEntry) => {
            if (entry.id) {
              console.log('Deleting entry with id:', entry.id);
              
              const deletePromise = this.stockService.deleteStock(entry.id)
                .toPromise()
                .then(response => {
                  console.log('Delete successful:', response);
                  return response;
                })
                .catch(error => {
                  console.error('Delete failed:', error);
                  console.error('Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    error: error.error
                  });
                  throw error;
                });
              
              promises.push(deletePromise);
            }
          });
        } else {
          console.log('No deletions to process');
        }

        if (promises.length === 0) {
          console.log('No operations to perform');
          return;
        }

        Promise.all(promises)
          .then(() => {
            console.log('All operations completed successfully');
            this.snackBar.open('Stock updated successfully', 'Close', { duration: 3000 });
            this.loadStockEntries();
          })
          .catch(error => {
            console.error('Error updating stock:', error);
            this.snackBar.open('Error updating stock', 'Close', { duration: 3000 });
          });
      }
    });
  }

  saveStock(): void {
    // In a real application, you would save the stock entries
    console.log('Stock entries:', this.stockEntries);
  }

  setTab(tab: 'browse' | 'add' | 'stock'): void {
    this.activeTab = tab;
    if (tab === 'browse') {
      this.resetForm();
    } else if (tab === 'add' && !this.editingArticle) {
      this.resetForm();
    }
  }

  applyStockFilters(): void {
    this.filteredStockEntries = this.stockEntries.filter(entry => {
      const matchesCode = !this.stockFilters.code || 
        this.formatStockCode(entry).toLowerCase().includes(this.stockFilters.code.toLowerCase());
      const matchesLibelle = !this.stockFilters.libelle || 
        this.formatStockLibelle(entry).toLowerCase().includes(this.stockFilters.libelle.toLowerCase());
      const matchesQuantity = !this.stockFilters.quantity || 
        entry.quantite.toString().includes(this.stockFilters.quantity);
      const matchesSphere = !this.stockFilters.sphere || 
        entry.sphere.toString().includes(this.stockFilters.sphere);

      // If addition filter is active, only show addition type articles
      if (this.stockFilters.addition) {
        if (entry.type_stock !== 'addition') return false;
        return entry.addition !== null && 
               entry.addition.toString().includes(this.stockFilters.addition);
      }

      // If cylindre filter is active, only show cylindre type articles
      if (this.stockFilters.cylindre) {
        if (entry.type_stock !== 'cylindre') return false;
        return entry.cylindre !== null && 
               entry.cylindre.toString().includes(this.stockFilters.cylindre);
      }

      return matchesCode && matchesLibelle && matchesQuantity && matchesSphere;
    });
  }

  clearStockFilters(): void {
    this.stockFilters = {
      code: '',
      libelle: '',
      quantity: '',
      sphere: '',
      cylindre: '',
      addition: ''
    };
    this.applyStockFilters();
  }

  exportToCSV(): void {
    if (this.activeTab === 'stock') {
      this.exportStockToCSV();
    } else {
      this.exportArticlesToCSV();
    }
  }

  exportToPDF(): void {
    if (this.activeTab === 'stock') {
      this.exportStockToPDF();
    } else {
      this.exportArticlesToPDF();
    }
  }

  exportArticlesToCSV(): void {
    interface ArticleExport {
      Code: string;
      Libelle: string;
      Diametre: number;
      Foyer: string | undefined;
      Indice: string | undefined;
      Design: string | undefined;
      'Prix Achat': number;
      'Prix Vente': number;
    }

    const data: ArticleExport[] = this.filteredArticles.map(article => ({
      Code: article.code,
      Libelle: article.libelle,
      Diametre: article.diametre,
      Foyer: article.foyer_name,
      Indice: article.indice_name,
      Design: article.design_name,
      'Prix Achat': article.prix_achat,
      'Prix Vente': article.prix_vente
    }));

    // Create CSV content manually
    const headers = Object.keys(data[0]) as (keyof ArticleExport)[];
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ];
    const csvContent = csvRows.join('\n');

    // Create and download file with proper UTF-8 encoding
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data.map(row => 
      headers.map(header => row[header])
    )]);
    const workbook: XLSX.WorkBook = { Sheets: { 'Articles': worksheet }, SheetNames: ['Articles'] };
    
    // Convert to CSV with proper encoding
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',' });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'articles.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportStockToCSV(): void {
    interface StockExport {
      Code: string;
      Libelle: string;
      Quantite: number;
      Sphere: number;
      Cylindre: number | null;
      Addition: number;
    }

    const data: StockExport[] = this.filteredStockEntries.map(entry => ({
      Code: this.formatStockCode(entry).replace(/—/g, '-'),
      Libelle: this.formatStockLibelle(entry).replace(/—/g, '-'),
      Quantite: entry.quantite,
      Sphere: entry.sphere,
      Cylindre: entry.cylindre,
      Addition: entry.addition || 0
    }));

    // Create CSV content manually
    const headers = Object.keys(data[0]) as (keyof StockExport)[];
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ];
    const csvContent = csvRows.join('\n');

    // Create and download file with proper UTF-8 encoding
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data.map(row => 
      headers.map(header => row[header])
    )]);
    const workbook: XLSX.WorkBook = { Sheets: { 'Stock': worksheet }, SheetNames: ['Stock'] };
    
    // Convert to CSV with proper encoding
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',' });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportArticlesToPDF(): void {
    const doc = new jsPDF();
    
    doc.text('Articles List', 14, 15);
    
    const data = this.filteredArticles.map(article => [
      article.code || '',
      article.libelle || '',
      article.diametre || 0,
      article.foyer_name || '',
      article.indice_name || '',
      article.design_name || '',
      article.prix_achat || 0,
      article.prix_vente || 0
    ]);

    autoTable(doc, {
      head: [['Code', 'Libelle', 'Diametre', 'Foyer', 'Indice', 'Design', 'Prix Achat', 'Prix Vente']],
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save('articles.pdf');
  }

  exportStockToPDF(): void {
    const doc = new jsPDF();
    
    doc.text('Stock List', 14, 15);
    
    const data = this.filteredStockEntries.map(entry => [
      this.formatStockCode(entry),
      this.formatStockLibelle(entry),
      entry.quantite || 0,
      entry.sphere || 0,
      entry.cylindre || 0,
      entry.addition || 0
    ]);

    autoTable(doc, {
      head: [['Code', 'Libelle', 'Quantite', 'Sphere', 'Cylindre', 'Addition']],
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save('stock.pdf');
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredArticles.sort((a: any, b: any) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filteredArticles = [...this.articles];
    
    // Reapply sorting if active
    if (this.sortColumn) {
      this.onSort(this.sortColumn);
    }
  }

  private setTvaValue(): void {
    this.articleForm.patchValue({ tva: 18 });
  }
}
