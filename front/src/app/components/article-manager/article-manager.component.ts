import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArticleService, Article } from '../../services/article.service';
import { ArticleParamsService } from '../../services/article-params.service';
import { ArticleHierarchyService } from '../../shared/services/article-hierarchy.service';
import { ArticleSubfamily } from '../../shared/models/article-hierarchy.model';
import { StockDialogComponent } from './stock-dialog/stock-dialog.component';
import { StockService, StockEntry as ApiStockEntry } from '../../services/stock.service';

interface DialogStockEntry {
  sphere: number;
  cylindre: number;
  quantite: number;
}

@Component({
  selector: 'app-article-manager',
  standalone: false,
  templateUrl: './article-manager.component.html',
  styleUrl: './article-manager.component.scss'
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
  activeTab: 'browse' | 'add' = 'browse';
  editingArticle: Article | null = null;

  // Stock management
  sphereValues: number[] = Array.from({length: 33}, (_, i) => -4 + (i * 0.25));
  cylindreValues: number[] = Array.from({length: 9}, (_, i) => -2 + (i * 0.25));
  stockEntries: DialogStockEntry[] = [];

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
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private initializeStockEntries(): void {
    this.stockEntries = [];
    this.sphereValues.forEach(sphere => {
      this.cylindreValues.forEach(cylindre => {
        this.stockEntries.push({
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
        // Save stock entries
        const stockEntries: ApiStockEntry[] = result.map((entry: DialogStockEntry) => ({
          article_id: article.id!,
          sphere: entry.sphere,
          cylindre: entry.cylindre,
          quantite: entry.quantite
        }));

        // First, get existing stock entries
        this.stockService.getStockByArticleId(article.id!).subscribe({
          next: (existingEntries) => {
            // Update or create entries
            const promises = stockEntries.map(entry => {
              const existingEntry = existingEntries.find(
                e => e.sphere === entry.sphere && e.cylindre === entry.cylindre
              );

              if (existingEntry) {
                return this.stockService.updateStock(existingEntry.id!, entry).toPromise();
              } else {
                return this.stockService.createStock(entry).toPromise();
              }
            });

            Promise.all(promises)
              .then(() => {
                this.snackBar.open('Stock updated successfully', 'Close', { duration: 3000 });
              })
              .catch(error => {
                console.error('Error updating stock:', error);
                this.snackBar.open('Error updating stock', 'Close', { duration: 3000 });
              });
          },
          error: (error) => {
            console.error('Error fetching existing stock:', error);
            this.snackBar.open('Error fetching existing stock', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  saveStock(): void {
    // In a real application, you would save the stock entries
    console.log('Stock entries:', this.stockEntries);
  }

  setTab(tab: 'browse' | 'add'): void {
    this.activeTab = tab;
    if (tab === 'add' && !this.editingArticle) {
      this.resetForm();
    }
  }
}
