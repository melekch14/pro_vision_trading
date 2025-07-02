import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Article } from '../../../services/article.service';
import { StockService, StockEntry as ApiStockEntry } from '../../../services/stock.service';
import { SupplementaryPriceService, SupplementaryPrice as ApiSupplementaryPrice, StockWithSupplementaryPrice } from '../../../services/supplementary-price.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DialogSupplementaryPrice {
  sphere: number;
  cylindre: number | null;
  prix_supplement: number;
  stock_id?: number;
  modified?: boolean;
  hasStock?: boolean;
}

@Component({
  selector: 'app-supplementary-price-dialog',
  templateUrl: './supplementary-price-dialog.component.html',
  styleUrls: ['./supplementary-price-dialog.component.scss'],
  standalone: false
})
export class SupplementaryPriceDialogComponent implements OnInit {
  sphereValues: number[] = [];
  cylindreValues: number[] = [];
  supplementaryPrices: DialogSupplementaryPrice[] = [];
  existingPrices: ApiSupplementaryPrice[] = [];
  stockWithPrices: StockWithSupplementaryPrice[] = [];
  filterSphere: number | null = null;
  filterCylindre: number | null = null;
  selectedCells: Set<string> = new Set();
  bulkPrice: number = 0;

  constructor(
    public dialogRef: MatDialogRef<SupplementaryPriceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { article: Article },
    private stockService: StockService,
    private supplementaryPriceService: SupplementaryPriceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setSphereValues();
    this.setCylindreValues();
    this.initializeSupplementaryPrices();
    this.loadExistingData();
  }

  private setSphereValues(): void {
    const min = this.data.article.min_sphere !== null && this.data.article.min_sphere !== undefined && !isNaN(Number(this.data.article.min_sphere)) 
      ? Number(this.data.article.min_sphere) 
      : -4;
    const max = this.data.article.max_sphere !== null && this.data.article.max_sphere !== undefined && !isNaN(Number(this.data.article.max_sphere)) 
      ? Number(this.data.article.max_sphere) 
      : 4;
    
    this.sphereValues = this.generateRange(min, max, 0.25);
  }

  private setCylindreValues(): void {
    if (this.data.article.type_stock === 'addition') {
      const min = this.data.article.min_addition !== null && this.data.article.min_addition !== undefined && !isNaN(Number(this.data.article.min_addition)) 
        ? Number(this.data.article.min_addition) 
        : 0;
      const max = this.data.article.max_addition !== null && this.data.article.max_addition !== undefined && !isNaN(Number(this.data.article.max_addition)) 
        ? Number(this.data.article.max_addition) 
        : 5;
      this.cylindreValues = this.generateRange(min, max, 0.25);
    } else {
      const min = this.data.article.min_cylindre !== null && this.data.article.min_cylindre !== undefined && !isNaN(Number(this.data.article.min_cylindre)) 
        ? Number(this.data.article.min_cylindre) 
        : -5;
      const max = this.data.article.max_cylindre !== null && this.data.article.max_cylindre !== undefined && !isNaN(Number(this.data.article.max_cylindre)) 
        ? Number(this.data.article.max_cylindre) 
        : 5;
      this.cylindreValues = this.generateRange(min, max, 0.25);
    }
  }

  private generateRange(min: number, max: number, step: number): number[] {
    const values: number[] = [];
    for (let v = min; v <= max + 0.001; v += step) {
      values.push(Number(v.toFixed(2)));
    }
    return values;
  }

  private initializeSupplementaryPrices(): void {
    this.supplementaryPrices = [];
    this.sphereValues.forEach(sphere => {
      this.cylindreValues.forEach(cylindre => {
        this.supplementaryPrices.push({
          sphere,
          cylindre,
          prix_supplement: 0,
          modified: false,
          hasStock: false
        });
      });
    });
  }

  private loadExistingData(): void {
    // Load stock with supplementary prices
    this.supplementaryPriceService.getStockWithSupplementaryPrices(this.data.article.id!).subscribe({
      next: (stockData) => {
        this.stockWithPrices = stockData;
        
        // Mark cells that have stock
        stockData.forEach(stock => {
          const priceEntry = this.supplementaryPrices.find(
            e => Math.abs(e.sphere - stock.sphere) < 0.001 && 
                 (stock.cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - stock.cylindre) < 0.001))
          );
          if (priceEntry) {
            priceEntry.hasStock = stock.quantite > 0;
            priceEntry.stock_id = stock.id;
            if (stock.prix_supplement !== null) {
              priceEntry.prix_supplement = stock.prix_supplement;
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading stock with prices:', error);
        this.snackBar.open('Error loading stock data', 'Close', { duration: 3000 });
      }
    });

    // Load existing supplementary prices
    this.supplementaryPriceService.getSupplementaryPricesByArticleId(this.data.article.id!).subscribe({
      next: (prices) => {
        this.existingPrices = prices;
        prices.forEach(price => {
          const sphere = parseFloat(price.sphere.toString());
          const value = this.data.article.type_stock === 'addition' ? price.addition : price.cylindre;
          const priceEntry = this.supplementaryPrices.find(
            e => Math.abs(e.sphere - sphere) < 0.001 && 
                 (value === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - value) < 0.001))
          );
          if (priceEntry) {
            priceEntry.prix_supplement = price.prix_supplement;
            priceEntry.modified = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading supplementary prices:', error);
        this.snackBar.open('Error loading supplementary prices', 'Close', { duration: 3000 });
      }
    });
  }

  hasExistingPrice(sphere: number, cylindre: number | null): boolean {
    return this.existingPrices.some(price => {
      const priceSphere = parseFloat(price.sphere.toString());
      const value = this.data.article.type_stock === 'addition' ? price.addition : price.cylindre;
      return Math.abs(priceSphere - sphere) < 0.001 && 
             (value === null ? cylindre === null : (cylindre !== null && Math.abs(value - cylindre) < 0.001));
    });
  }

  hasNonZeroPrice(sphere: number, cylindre: number | null): boolean {
    const entry = this.supplementaryPrices.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    return entry ? entry.prix_supplement > 0 : false;
  }

  hasStock(sphere: number, cylindre: number | null): boolean {
    const entry = this.supplementaryPrices.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    return entry ? entry.hasStock || false : false;
  }

  getPrice(sphere: number, cylindre: number | null): number {
    const entry = this.supplementaryPrices.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    return entry ? entry.prix_supplement : 0;
  }

  onPriceChange(sphere: number, cylindre: number | null, value: number): void {
    const entry = this.supplementaryPrices.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    if (entry) {
      entry.prix_supplement = value;
      entry.modified = true;
    }
  }

  onCellClick(sphere: number, cylindre: number | null, event: MouseEvent): void {
    const cellKey = `${sphere}-${cylindre}`;
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (this.selectedCells.has(cellKey)) {
        this.selectedCells.delete(cellKey);
      } else {
        this.selectedCells.add(cellKey);
      }
    } else {
      // Single select
      this.selectedCells.clear();
      this.selectedCells.add(cellKey);
    }
  }

  isCellSelected(sphere: number, cylindre: number | null): boolean {
    const cellKey = `${sphere}-${cylindre}`;
    return this.selectedCells.has(cellKey);
  }

  applyBulkPrice(): void {
    if (this.bulkPrice <= 0) {
      this.snackBar.open('Please enter a valid price', 'Close', { duration: 3000 });
      return;
    }

    this.selectedCells.forEach(cellKey => {
      const [sphereStr, cylindreStr] = cellKey.split('-');
      const sphere = parseFloat(sphereStr);
      const cylindre = cylindreStr === 'null' ? null : parseFloat(cylindreStr);
      
      const entry = this.supplementaryPrices.find(
        e => Math.abs(e.sphere - sphere) < 0.001 && 
             (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
      );
      
      if (entry && entry.hasStock) {
        entry.prix_supplement = this.bulkPrice;
        entry.modified = true;
      }
    });

    this.snackBar.open(`Applied price ${this.bulkPrice} to ${this.selectedCells.size} selected cells`, 'Close', { duration: 2000 });
  }

  clearSelection(): void {
    this.selectedCells.clear();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.data.article.id) {
      this.snackBar.open('Article ID is missing', 'Close', { duration: 3000 });
      return;
    }

    const entriesToSave = this.supplementaryPrices.filter(entry => entry.prix_supplement > 0 && entry.hasStock);
    
    const updates: ApiSupplementaryPrice[] = [];
    const insertions: ApiSupplementaryPrice[] = [];

    entriesToSave.forEach(entry => {
      if (!entry.stock_id) {
        console.warn('No stock_id found for entry:', entry);
        return;
      }

      const existingPrice = this.existingPrices.find(p => {
        const priceSphere = parseFloat(p.sphere.toString());
        const value = this.data.article.type_stock === 'addition' ? p.addition : p.cylindre;
        return Math.abs(priceSphere - entry.sphere) < 0.001 && 
               (value === null ? entry.cylindre === null : (entry.cylindre !== null && Math.abs(value - entry.cylindre) < 0.001));
      });

      const supplementaryPrice: ApiSupplementaryPrice = {
        stock_id: entry.stock_id,
        sphere: entry.sphere,
        cylindre: this.data.article.type_stock === 'cylindre' ? entry.cylindre : null,
        addition: this.data.article.type_stock === 'addition' ? entry.cylindre : null,
        prix_supplement: entry.prix_supplement
      };

      if (existingPrice) {
        if (entry.modified) {
          updates.push({
            ...supplementaryPrice,
            id: existingPrice.id
          });
        }
      } else {
        insertions.push(supplementaryPrice);
      }
    });

    const deletions: ApiSupplementaryPrice[] = this.existingPrices.filter(existingPrice => {
      const priceSphere = parseFloat(existingPrice.sphere.toString());
      const value = this.data.article.type_stock === 'addition' ? existingPrice.addition : existingPrice.cylindre;
      const currentEntry = this.supplementaryPrices.find(
        e => Math.abs(e.sphere - priceSphere) < 0.001 && 
             (value === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - value) < 0.001))
      );
      return currentEntry && currentEntry.prix_supplement === 0;
    });

    this.dialogRef.close({
      updates,
      insertions,
      deletions
    });
  }

  get filteredSphereValues(): number[] {
    if (this.filterSphere !== null && !isNaN(this.filterSphere)) {
      return this.sphereValues.filter(s => Math.abs(s - this.filterSphere!) < 0.001);
    }
    return this.sphereValues;
  }

  get filteredCylindreValues(): number[] {
    if (this.filterCylindre !== null && !isNaN(this.filterCylindre)) {
      return this.cylindreValues.filter(c => Math.abs(c - this.filterCylindre!) < 0.001);
    }
    return this.cylindreValues;
  }
} 