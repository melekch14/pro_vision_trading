import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { StockDialogComponent } from './stock-dialog/stock-dialog.component';

interface Article {
  code: string;
  libelle: string;
  diametre: number;
  foyer_id: number;
  indice_id: number;
  design_id: number;
  couleur_photo_id: number;
  traitement_id: number;
  axe: string;
  addition: number;
  prix_achat: number;
  tva: number;
  prix_vente: number;
  code_a_barre: string;
  expiration: string;
  fournisseur_id: string;
  typeArticle_id: number;
}

interface StockEntry {
  sphere: number;
  cylindre: number;
  quantity: number;
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
  
  // Static options
  foyerOptions = [1, 2, 3];
  indiceOptions = [1, 2, 3];
  designOptions = [1, 2, 3];
  couleurPhotoOptions = [1, 2, 3];
  traitementOptions = [1, 2, 3];
  fournisseurOptions = ['F1', 'F2', 'F3'];
  typeArticleOptions = [1, 2, 3];
  
  // Stock management
  sphereValues: number[] = Array.from({length: 33}, (_, i) => -4 + (i * 0.25));
  cylindreValues: number[] = Array.from({length: 9}, (_, i) => -2 + (i * 0.25));
  stockEntries: StockEntry[] = [];

  // Tab state
  activeTab: 'browse' | 'add' = 'browse';

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.articleForm = this.fb.group({
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      diametre: [null, [Validators.required, Validators.min(0)]],
      foyer_id: [null, Validators.required],
      indice_id: [null, Validators.required],
      design_id: [null, Validators.required],
      couleur_photo_id: [null, Validators.required],
      traitement_id: [null, Validators.required],
      axe: ['', Validators.required],
      addition: [null, [Validators.required, Validators.min(0)]],
      prix_achat: [null, [Validators.required, Validators.min(0)]],
      tva: [null, [Validators.required, Validators.min(0)]],
      prix_vente: [null, [Validators.required, Validators.min(0)]],
      code_a_barre: ['', Validators.required],
      expiration: ['', Validators.required],
      fournisseur_id: [null, Validators.required],
      typeArticle_id: [null, Validators.required]
    });

    this.filterForm = this.fb.group({
      libelle: [''],
      fournisseur_id: [''],
      typeArticle_id: ['']
    });

    // Initialize stock entries
    this.initializeStockEntries();
  }

  ngOnInit(): void {
    // Load mock data
    this.loadMockData();
    
    // Subscribe to filter changes
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
          quantity: 0
        });
      });
    });
  }

  private loadMockData(): void {
    // Mock data
    this.articles = [
      {
        code: 'ART001',
        libelle: 'Article Test 1',
        diametre: 14.5,
        foyer_id: 1,
        indice_id: 1,
        design_id: 1,
        couleur_photo_id: 1,
        traitement_id: 1,
        axe: '90',
        addition: 2.5,
        prix_achat: 100,
        tva: 20,
        prix_vente: 150,
        code_a_barre: '123456789',
        expiration: '2024-12-31',
        fournisseur_id: 'F1',
        typeArticle_id: 1
      },
      {
        code: 'ART002',
        libelle: 'Article Test 1',
        diametre: 14.5,
        foyer_id: 1,
        indice_id: 1,
        design_id: 1,
        couleur_photo_id: 1,
        traitement_id: 1,
        axe: '90',
        addition: 2.5,
        prix_achat: 100,
        tva: 20,
        prix_vente: 150,
        code_a_barre: '123456789',
        expiration: '2024-12-31',
        fournisseur_id: 'F2',
        typeArticle_id: 2
      },
    ];
    this.filteredArticles = [...this.articles];
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      const newArticle = this.articleForm.value;
      this.articles.push(newArticle);
      this.filteredArticles = [...this.articles];
      this.articleForm.reset();
      // In a real application, you would call a service to save the article
      console.log('Article saved:', newArticle);
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.filteredArticles = this.articles.filter(article => {
      return (
        (!filters.libelle || article.libelle.toLowerCase().includes(filters.libelle.toLowerCase())) &&
        (!filters.fournisseur_id || article.fournisseur_id === filters.fournisseur_id) &&
        (!filters.typeArticle_id || article.typeArticle_id === filters.typeArticle_id)
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
        // In a real application, you would save the stock entries
        console.log('Stock entries saved:', result);
      }
    });
  }

  saveStock(): void {
    // In a real application, you would save the stock entries
    console.log('Stock entries:', this.stockEntries);
  }

  setTab(tab: 'browse' | 'add') {
    this.activeTab = tab;
  }
}
