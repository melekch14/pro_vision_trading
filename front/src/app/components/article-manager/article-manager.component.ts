import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { SupplementaryPriceDialogComponent } from './supplementary-price-dialog/supplementary-price-dialog.component';
import { StockService, StockEntryWithArticle, StockEntry as ApiStockEntry } from '../../services/stock.service';
import { SupplementaryPriceService, SupplementaryPrice as ApiSupplementaryPrice } from '../../services/supplementary-price.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { PriceFormatService } from '../../shared/services/price-format.service';

interface DialogStockEntry {
  sphere: number;
  cylindre: number;
  quantite: number;
}

// Add type for origineArticle
type OrigineArticle = 'stock' | 'fabrication';

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
  activeTab: 'browse' | 'add' | 'stock' | 'import-export' = 'browse';
  editingArticle: Article | null = null;

  // Import/Export properties
  @ViewChild('fileInput') fileInput!: ElementRef;
  allData: any[] = [];
  filteredAllData: any[] = [];
  allDataFilter: string = '';
  importSuccess: string | null = null;
  importError: string | null = null;

  // Stock management
  sphereValues: number[] = Array.from({ length: 33 }, (_, i) => -4 + (i * 0.25));
  cylindreValues: number[] = Array.from({ length: 9 }, (_, i) => -2 + (i * 0.25));
  dialogStockEntries: DialogStockEntry[] = [];

  // Stock panel properties
  stockEntries: StockEntryWithArticle[] = [];
  filteredStockEntries: StockEntryWithArticle[] = [];
  displayedColumns: string[] = ['code', 'libelle', 'qte', 'sphere', 'cylindre', 'addition'];
  stockQuantityByArticleId: Record<number, number> = {};

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

  // Computed property to check for zero quantity stocks
  get hasZeroQuantityStocks(): boolean {
    return this.stockEntries.some(entry => entry.quantite === 0);
  }

  get zeroQuantityStocksCount(): number {
    return this.stockEntries.filter(entry => entry.quantite === 0).length;
  }

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private articleParamsService: ArticleParamsService,
    private articleHierarchyService: ArticleHierarchyService,
    private stockService: StockService,
    private supplementaryPriceService: SupplementaryPriceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private priceFormat: PriceFormatService
  ) {
    this.articleForm = this.fb.group({
      article_subfamily_id: [''],
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      diametre: ['', [Validators.min(0)]],
      foyer_id: [''],
      indice_id: [''],
      design_id: [''],
      couleur_photo_id: [''],
      traitement_id: [''],
      prix_achat: ['', [Validators.min(0)]],
      tva: [18, [Validators.required, Validators.min(0)]],
      prix_vente: ['', [Validators.min(0)]],
      code_a_barre: [''],
      expiration: [''],
      fournisseur_id: [''],
      typeArticle_id: [''],
      type_stock: [''],
      origineArticle: ['stock', Validators.required],
      min_sphere: [null],
      max_sphere: [null],
      min_cylindre: [null],
      max_cylindre: [null],
      min_addition: [null],
      max_addition: [null]
    });

    // Subscribe to subfamily changes
    this.articleForm.get('article_subfamily_id')?.valueChanges.subscribe(subfamilyId => {
      // Do not set code and libelle when a Sous-famille is selected
      // (Requirement: selecting Sous-famille should not auto-fill code/libelle)
      // const selectedSubfamily = this.subfamilyOptions.find(sf => sf.id === Number(subfamilyId));
      // if (selectedSubfamily) {
      //   this.articleForm.patchValue({
      //     code: selectedSubfamily.code,
      //     libelle: selectedSubfamily.name
      //   }, { emitEvent: false }); // Prevent infinite loop
      // }
    });

    // Subscribe to prix_achat changes to calculate prix_vente
    this.articleForm.get('prix_achat')?.valueChanges.subscribe(prixAchat => {
      if (prixAchat) {
        const tva = 18; // Fixed TVA at 18%
        const prixVente = prixAchat * (1 + tva / 100);
        this.articleForm.patchValue({
          prix_vente: prixVente.toFixed(3)
        }, { emitEvent: false });
      }
    });

    // Ensure TVA is always set to 18
    this.articleForm.get('tva')?.setValue(18);

    this.filterForm = this.fb.group({
      code: [''],
      libelle: [''],
      fournisseur: [''],
      origineArticle: ['']
    });

    // Initialize stock entries
    this.initializeStockEntries();
  }

  ngOnInit(): void {
    this.loadArticles();
    this.loadOptions();
    this.loadStockEntries();
    this.loadAllData();

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
        this.stockQuantityByArticleId = this.stockEntries.reduce((acc, entry) => {
          acc[entry.article_id] = (acc[entry.article_id] || 0) + (entry.quantite || 0);
          return acc;
        }, {} as Record<number, number>);
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
    return `${entry.subfamily_code} / (${cyl}) / ${sph}`;
  }

  formatStockLibelle(entry: StockEntryWithArticle): string {
    const cyl = entry.cylindre !== null ? entry.cylindre.toString().padStart(4, '0') :
      (entry.addition !== null ? entry.addition.toString().padStart(4, '0') : '0000');
    const sph = entry.sphere.toString().padStart(4, '0');
    return `${entry.article_libelle} (${cyl}) / ${sph}`;
  }

  getArticleTotalQuantity(article: Article): number | null {
    if (article.origineArticle !== 'stock') {
      return null;
    }
    if (article.id !== undefined && article.id !== null) {
      const key = Number(article.id);
      return this.stockQuantityByArticleId[key] || 0;
    }
    if (article.code) {
      const totalByCode = this.stockEntries
        .filter(entry => entry.article_code === article.code)
        .reduce((sum, entry) => sum + (entry.quantite || 0), 0);
      return totalByCode;
    }
    return 0;
  }


  onSubmit(): void {
    if (this.articleForm.valid) {
      const articleData = { ...this.articleForm.value };

      // No need to format expiration, use as-is
      // if (articleData.expiration) {
      //   articleData.expiration = articleData.expiration.substring(0, 10);
      // }

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
    // Use expiration as-is since it is now a varchar in the database
    this.articleForm.patchValue({
      ...article,
      expiration: article.expiration || ''
    });
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
    // Reset min/max fields
    this.articleForm.patchValue({
      min_sphere: null,
      max_sphere: null,
      min_cylindre: null,
      max_cylindre: null,
      min_addition: null,
      max_addition: null
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredArticles = this.articles.filter(article => {
      return (
        (!filters.code || article.code.toLowerCase().includes(filters.code.toLowerCase())) &&
        (!filters.libelle || article.libelle.toLowerCase().includes(filters.libelle.toLowerCase())) &&
        (!filters.fournisseur || article.fournisseur_id === filters.fournisseur) &&
        (!filters.origineArticle || article.origineArticle === filters.origineArticle)
      );
    });

    // Reapply sorting if active
    if (this.sortColumn) {
      this.onSort(this.sortColumn);
    }
  }

  openStockDialog(article: Article): void {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      maxHeight: '90vh',
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

  openSupplementaryPriceDialog(article: Article): void {
    const dialogRef = this.dialog.open(SupplementaryPriceDialogComponent, {
      maxHeight: '90vh',
      data: { article }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Supplementary price dialog result:', result);
        const promises: Promise<any>[] = [];

        // Handle updates
        if (result.updates && result.updates.length > 0) {
          console.log('Processing supplementary price updates:', result.updates);
          result.updates.forEach((entry: ApiSupplementaryPrice) => {
            console.log('Updating supplementary price with data:', {
              id: entry.id,
              stock_id: entry.stock_id,
              sphere: entry.sphere,
              cylindre: entry.cylindre,
              prix_supplement: entry.prix_supplement
            });

            const updatePromise = this.supplementaryPriceService.updateSupplementaryPrice(entry.id!, entry)
              .toPromise()
              .then(response => {
                console.log('Supplementary price update successful:', response);
                return response;
              })
              .catch(error => {
                console.error('Supplementary price update failed:', error);
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
          console.log('No supplementary price updates to process');
        }

        // Handle insertions
        if (result.insertions && result.insertions.length > 0) {
          console.log('Processing supplementary price insertions:', result.insertions);
          result.insertions.forEach((entry: ApiSupplementaryPrice) => {
            console.log('Inserting supplementary price with data:', {
              stock_id: entry.stock_id,
              sphere: entry.sphere,
              cylindre: entry.cylindre,
              prix_supplement: entry.prix_supplement
            });

            const insertPromise = this.supplementaryPriceService.createSupplementaryPrice(entry)
              .toPromise()
              .then(response => {
                console.log('Supplementary price insert successful:', response);
                return response;
              })
              .catch(error => {
                console.error('Supplementary price insert failed:', error);
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
          console.log('No supplementary price insertions to process');
        }

        // Handle deletions
        if (result.deletions && result.deletions.length > 0) {
          console.log('Processing supplementary price deletions:', result.deletions);
          result.deletions.forEach((entry: ApiSupplementaryPrice) => {
            if (entry.id) {
              console.log('Deleting supplementary price with id:', entry.id);

              const deletePromise = this.supplementaryPriceService.deleteSupplementaryPrice(entry.id)
                .toPromise()
                .then(response => {
                  console.log('Supplementary price delete successful:', response);
                  return response;
                })
                .catch(error => {
                  console.error('Supplementary price delete failed:', error);
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
          console.log('No supplementary price deletions to process');
        }

        if (promises.length === 0) {
          console.log('No supplementary price operations to perform');
          return;
        }

        Promise.all(promises)
          .then(() => {
            console.log('All supplementary price operations completed successfully');
            this.snackBar.open('Supplementary prices updated successfully', 'Close', { duration: 3000 });
          })
          .catch(error => {
            console.error('Error updating supplementary prices:', error);
            this.snackBar.open('Error updating supplementary prices', 'Close', { duration: 3000 });
          });
      }
    });
  }

  saveStock(): void {
    // In a real application, you would save the stock entries
    console.log('Stock entries:', this.stockEntries);
  }

  setTab(tab: 'browse' | 'add' | 'stock' | 'import-export'): void {
    this.activeTab = tab;
    if (tab === 'browse') {
      this.resetForm();
    } else if (tab === 'add' && !this.editingArticle) {
      this.resetForm();
    } else if (tab === 'import-export') {
      this.loadAllData();
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

      // Only filter addition if type_stock is 'addition'
      const matchesAddition = !this.stockFilters.addition ||
        (entry.type_stock === 'addition' && entry.addition !== null && entry.addition.toString().includes(this.stockFilters.addition));

      // Only filter cylindre if type_stock is 'cylindre'
      const matchesCylindre = !this.stockFilters.cylindre ||
        (entry.type_stock === 'cylindre' && entry.cylindre !== null && entry.cylindre.toString().includes(this.stockFilters.cylindre));

      return matchesCode && matchesLibelle && matchesQuantity && matchesSphere && matchesAddition && matchesCylindre;
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
      'Prix Achat': string;
      'Prix Vente': string;
      'Origine Article': string;
    }

    const data: ArticleExport[] = this.filteredArticles.map(article => ({
      Code: article.code,
      Libelle: article.libelle,
      Diametre: article.diametre,
      Foyer: article.foyer_name,
      Indice: article.indice_name,
      Design: article.design_name,
      'Prix Achat': this.priceFormat.format(article.prix_achat),
      'Prix Vente': this.priceFormat.format(article.prix_vente),
      'Origine Article': article.origineArticle
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
      this.priceFormat.format(article.prix_achat),
      this.priceFormat.format(article.prix_vente),
      article.origineArticle || 'stock'
    ]);

    autoTable(doc, {
      head: [['Code', 'Libelle', 'Diametre', 'Foyer', 'Indice', 'Design', 'Prix Achat', 'Prix Vente', 'Origine Article']],
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

  // Import/Export methods
  loadAllData(): void {
    this.articleService.getAllData().subscribe({
      next: (data) => {
        this.allData = data;
        this.applyAllDataFilters();
      },
      error: (error) => {
        console.error('Error loading all data:', error);
        this.snackBar.open('Error loading all data', 'Close', { duration: 3000 });
      }
    });
  }

  applyAllDataFilters(): void {
    if (!this.allDataFilter) {
      this.filteredAllData = [...this.allData];
      return;
    }

    const filter = this.allDataFilter.toLowerCase();
    this.filteredAllData = this.allData.filter(article => {
      return (
        (article.code && article.code.toLowerCase().includes(filter)) ||
        (article.libelle && article.libelle.toLowerCase().includes(filter)) ||
        (article.group_name && article.group_name.toLowerCase().includes(filter)) ||
        (article.family_name && article.family_name.toLowerCase().includes(filter)) ||
        (article.subfamily_name && article.subfamily_name.toLowerCase().includes(filter)) ||
        (article.type_article_name && article.type_article_name.toLowerCase().includes(filter)) ||
        (article.foyer_name && article.foyer_name.toLowerCase().includes(filter)) ||
        (article.indice_name && article.indice_name.toLowerCase().includes(filter)) ||
        (article.design_name && article.design_name.toLowerCase().includes(filter))
      );
    });
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

    const formData = new FormData();
    formData.append('file', file);

    this.articleService.importArticlesFromExcel(formData).subscribe({
      next: (result) => {
        let message = `Import réussi: ${result.importedCount} enregistrement(s) importé(s) sur ${result.totalRecords}`;
        if (result.errors && result.errors.length > 0) {
          message += `, ${result.errors.length} erreur(s)`;
        }
        this.importSuccess = message;
        this.importError = null;
        this.loadArticles();
        this.loadAllData();
        this.loadStockEntries();
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      },
      error: (error) => {
        this.importError = error.error?.message || 'Erreur lors de l\'importation du fichier';
        this.importSuccess = null;
        // Reset file input
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    });
  }

  exportAllDataToExcel(): void {
    const exportData = this.filteredAllData.map(article => ({
      'Code Groupe': article.group_code || '',
      'Nom Groupe': article.group_name || '',
      'Code famille': article.family_code || '',
      'Nom famille': article.family_name || '',
      'Code sous famille': article.subfamily_code || '',
      'Nom sous famille': article.subfamily_name || '',
      'Code ARTICLE': article.code || '',
      'Libelle': article.libelle || '',
      'Diamètre': article.diametre || '',
      'Type d\'article': article.type_article_name || '',
      'Origine (stock / fabrication)': article.origineArticle || '',
      'Foyer': article.foyer_name || '',
      'Indice': article.indice_name || '',
      'Design': article.design_name || '',
      'Type de stock (addition / cyl)': article.type_stock || '',
      'Couleur photo': article.couleur_photo_name || '',
      'Traitement': article.traitement_name || '',
      'Fournisseur': article.fournisseur_name || '',
      'Code a barre': article.code_a_barre || '',
      'Prix d\'achat ht': this.priceFormat.format(article.prix_achat),
      'Prix d\'achat ttc': this.priceFormat.format(article.prix_achat ? (article.prix_achat * (1 + (article.tva || 0) / 100)) : ''),
      'Prix de vente ht': this.priceFormat.format(article.prix_vente),
      'Prix de vente ttc': this.priceFormat.format(article.prix_vente ? (article.prix_vente * (1 + (article.tva || 0) / 100)) : '')
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Articles': worksheet }, SheetNames: ['Articles'] };

    XLSX.writeFile(workbook, 'articles_all_data.xlsx');
  }
}
