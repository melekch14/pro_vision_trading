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
import 'jspdf-autotable';
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
  typeArticleOptions = [1, 2, 3]; // Static for now
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
  displayedColumns: string[] = ['code', 'libelle', 'quantite', 'sphere', 'cylindre'];
  
  stockFilters = {
    code: '',
    libelle: '',
    quantity: ''
  };

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
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      diametre: ['', [Validators.required, Validators.min(0)]],
      foyer_id: ['', Validators.required],
      indice_id: ['', Validators.required],
      design_id: ['', Validators.required],
      couleur_photo_id: ['', Validators.required],
      traitement_id: ['', Validators.required],
      axe: ['', Validators.required],
      addition: ['', [Validators.required, Validators.min(0)]],
      prix_achat: ['', [Validators.required, Validators.min(0)]],
      tva: ['', [Validators.required, Validators.min(0)]],
      prix_vente: ['', [Validators.required, Validators.min(0)]],
      code_a_barre: ['', Validators.required],
      expiration: ['', Validators.required],
      fournisseur_id: ['', Validators.required],
      typeArticle_id: ['', Validators.required],
      article_subfamily_id: ['', Validators.required]
    });

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
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.filteredArticles = [...articles];
      },
      error: (error) => {
        this.snackBar.open('Error loading articles', 'Close', { duration: 3000 });
        console.error('Error loading articles:', error);
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
    const cyl = entry.cylindre.toString().padStart(4, '0');
    const sph = entry.sphere.toString().padStart(4, '0');
    return `${entry.family_code}-${cyl}-${sph}`;
  }

  formatStockLibelle(entry: StockEntryWithArticle): string {
    const cyl = entry.cylindre.toString().padStart(4, '0');
    const sph = entry.sphere.toString().padStart(4, '0');
    return `${entry.article_libelle} (${cyl})-${sph}`;
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      const article = this.articleForm.value;
      
      if (this.editingArticle) {
        this.articleService.updateArticle(this.editingArticle.id!, article).subscribe({
          next: () => {
            this.snackBar.open('Article updated successfully', 'Close', { duration: 3000 });
            this.loadArticles();
            this.resetForm();
          },
          error: (error) => {
            this.snackBar.open('Error updating article', 'Close', { duration: 3000 });
            console.error('Error updating article:', error);
          }
        });
      } else {
        this.articleService.createArticle(article).subscribe({
          next: () => {
            this.snackBar.open('Article created successfully', 'Close', { duration: 3000 });
            this.loadArticles();
            this.resetForm();
          },
          error: (error) => {
            this.snackBar.open('Error creating article', 'Close', { duration: 3000 });
            console.error('Error creating article:', error);
          }
        });
      }
    }
  }

  editArticle(article: Article): void {
    this.editingArticle = article;
    this.articleForm.patchValue(article);
    this.setTab('add');
  }

  deleteArticle(id: number): void {
    if (confirm('Are you sure you want to delete this article?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.snackBar.open('Article deleted successfully', 'Close', { duration: 3000 });
          this.loadArticles();
        },
        error: (error) => {
          this.snackBar.open('Error deleting article', 'Close', { duration: 3000 });
          console.error('Error deleting article:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.articleForm.reset();
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
    if (tab === 'add' && !this.editingArticle) {
      this.resetForm();
    }
  }

  applyStockFilters(): void {
    this.filteredStockEntries = this.stockEntries.filter(entry => {
      const matchesCode = !this.stockFilters.code || 
        entry.article_code.toLowerCase().includes(this.stockFilters.code.toLowerCase());
      const matchesLibelle = !this.stockFilters.libelle || 
        entry.article_libelle.toLowerCase().includes(this.stockFilters.libelle.toLowerCase());
      const matchesQuantity = !this.stockFilters.quantity || 
        entry.quantite.toString().includes(this.stockFilters.quantity);

      return matchesCode && matchesLibelle && matchesQuantity;
    });
  }

  clearStockFilters(): void {
    this.stockFilters = {
      code: '',
      libelle: '',
      quantity: ''
    };
    this.applyStockFilters();
  }

  exportToCSV(): void {
    const data = this.filteredStockEntries.map(entry => ({
      'Code': entry.article_code,
      'Libellé': entry.article_libelle,
      'Quantité': entry.quantite,
      'Sphère': entry.sphere,
      'Cylindre': entry.cylindre,
      'Famille': entry.family_code,
      'Sous-famille': entry.subfamily_name
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'stock_export.csv');
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Stock Report', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const tableData = this.filteredStockEntries.map(entry => [
      entry.article_code,
      entry.article_libelle,
      entry.quantite.toString(),
      entry.sphere.toString(),
      entry.cylindre.toString(),
      entry.family_code,
      entry.subfamily_name
    ]);

    // Add table
    const options: UserOptions = {
      head: [['Code', 'Libellé', 'Quantité', 'Sphère', 'Cylindre', 'Famille', 'Sous-famille']],
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
    doc.save('stock_report.pdf');
  }
}
