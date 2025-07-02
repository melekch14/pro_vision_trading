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
  addition: number | null;
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
  isSelecting: boolean = false;
  selectionStart: { sphere: number; cylindre: number | null } | null = null;

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
    this.loadExistingData();
    
    // Add global mouse up listener
    document.addEventListener('mouseup', this.onGlobalMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    // Remove global mouse up listener
    document.removeEventListener('mouseup', this.onGlobalMouseUp.bind(this));
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
        // Check if this sphere/cylindre combination has stock
        const matchingStocks = this.stockWithPrices.filter(stock => {
          const sphereMatch = Math.abs(stock.sphere - sphere) < 0.001;
          
          if (this.data.article.type_stock === 'addition') {
            // For addition type, match against addition field
            const additionMatch = stock.addition === null ? cylindre === null : 
              (cylindre !== null && Math.abs(stock.addition - cylindre) < 0.001);
            return sphereMatch && additionMatch;
          } else {
            // For cylindre type, match against cylindre field
            const cylindreMatch = stock.cylindre === null ? cylindre === null : 
              (cylindre !== null && Math.abs(stock.cylindre - cylindre) < 0.001);
            return sphereMatch && cylindreMatch;
          }
        });
        
        const hasStock = matchingStocks.some(stock => stock.quantite > 0);
        const stockEntry = matchingStocks.find(stock => stock.quantite > 0);
        
        this.supplementaryPrices.push({
          sphere,
          cylindre: this.data.article.type_stock === 'cylindre' ? cylindre : null,
          addition: this.data.article.type_stock === 'addition' ? cylindre : null,
          prix_supplement: 0,
          modified: false,
          hasStock: hasStock,
          stock_id: stockEntry?.id
        });
      });
    });
  }

  private loadExistingData(): void {
    // Load stock with supplementary prices first
    this.supplementaryPriceService.getStockWithSupplementaryPrices(this.data.article.id!).subscribe({
      next: (stockData) => {
        this.stockWithPrices = stockData;
        
        // Initialize supplementary prices array with stock information
        this.initializeSupplementaryPrices();
        
        // Update existing supplementary prices from stock data
        stockData.forEach(stock => {
          if (stock.prix_supplement !== null) {
            const value = this.data.article.type_stock === 'addition' ? stock.addition : stock.cylindre;
            const priceEntry = this.findEntry(stock.sphere, value);
            if (priceEntry) {
              priceEntry.prix_supplement = stock.prix_supplement;
            }
          }
        });
        
        // Now load existing supplementary prices
        this.loadExistingSupplementaryPrices();
      },
      error: (error) => {
        console.error('Error loading stock with prices:', error);
        this.snackBar.open('Error loading stock data', 'Close', { duration: 3000 });
      }
    });
  }

  private loadExistingSupplementaryPrices(): void {
    // Load existing supplementary prices
    this.supplementaryPriceService.getSupplementaryPricesByArticleId(this.data.article.id!).subscribe({
      next: (prices) => {
        this.existingPrices = prices;
        prices.forEach(price => {
          const sphere = parseFloat(price.sphere.toString());
          const value = this.data.article.type_stock === 'addition' ? price.addition : price.cylindre;
          const priceEntry = this.findEntry(sphere, value);
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
    const entry = this.findEntry(sphere, cylindre);
    return entry ? entry.prix_supplement > 0 : false;
  }

  hasStock(sphere: number, cylindre: number | null): boolean {
    const entry = this.findEntry(sphere, cylindre);
    return entry ? entry.hasStock || false : false;
  }

  getPrice(sphere: number, cylindre: number | null): number {
    const entry = this.findEntry(sphere, cylindre);
    return entry ? entry.prix_supplement : 0;
  }

  onPriceChange(sphere: number, cylindre: number | null, value: number): void {
    const entry = this.findEntry(sphere, cylindre);
    if (entry) {
      entry.prix_supplement = value;
      entry.modified = true;
    }
  }

  private findEntry(sphere: number, cylindre: number | null): DialogSupplementaryPrice | undefined {
    return this.supplementaryPrices.find(e => {
      const sphereMatch = Math.abs(e.sphere - sphere) < 0.001;
      
      if (this.data.article.type_stock === 'addition') {
        // For addition type, match against addition field
        const additionMatch = e.addition === null ? cylindre === null : 
          (cylindre !== null && Math.abs(e.addition - cylindre) < 0.001);
        return sphereMatch && additionMatch;
      } else {
        // For cylindre type, match against cylindre field
        const cylindreMatch = e.cylindre === null ? cylindre === null : 
          (cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001);
        return sphereMatch && cylindreMatch;
      }
    });
  }

  onCellMouseDown(sphere: number, cylindre: number | null, event: MouseEvent): void {
    if (!this.hasStock(sphere, cylindre)) {
      return; // Don't allow selection of cells without stock
    }

    const cellKey = `${sphere}|${cylindre}`;
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (this.selectedCells.has(cellKey)) {
        this.selectedCells.delete(cellKey);
      } else {
        this.selectedCells.add(cellKey);
      }
    } else {
      // Start drag selection
      this.isSelecting = true;
      this.selectionStart = { sphere, cylindre };
      this.selectedCells.clear();
      this.selectedCells.add(cellKey);
    }
  }

  onCellMouseEnter(sphere: number, cylindre: number | null, event: MouseEvent): void {
    if (this.isSelecting && this.selectionStart && this.hasStock(sphere, cylindre)) {
      // Clear current selection and select the range
      this.selectedCells.clear();
      this.selectRange(this.selectionStart, { sphere, cylindre });
    }
  }

  onCellMouseUp(): void {
    this.isSelecting = false;
    this.selectionStart = null;
  }

  onGlobalMouseUp(): void {
    this.isSelecting = false;
    this.selectionStart = null;
  }

  private selectRange(start: { sphere: number; cylindre: number | null }, end: { sphere: number; cylindre: number | null }): void {
    const startSphereIndex = this.sphereValues.findIndex(s => Math.abs(s - start.sphere) < 0.001);
    const endSphereIndex = this.sphereValues.findIndex(s => Math.abs(s - end.sphere) < 0.001);
    const startCylindreIndex = this.cylindreValues.findIndex(c => Math.abs(c - (start.cylindre || 0)) < 0.001);
    const endCylindreIndex = this.cylindreValues.findIndex(c => Math.abs(c - (end.cylindre || 0)) < 0.001);

    if (startSphereIndex === -1 || endSphereIndex === -1 || startCylindreIndex === -1 || endCylindreIndex === -1) {
      return;
    }

    const minSphereIndex = Math.min(startSphereIndex, endSphereIndex);
    const maxSphereIndex = Math.max(startSphereIndex, endSphereIndex);
    const minCylindreIndex = Math.min(startCylindreIndex, endCylindreIndex);
    const maxCylindreIndex = Math.max(startCylindreIndex, endCylindreIndex);

    for (let i = minSphereIndex; i <= maxSphereIndex; i++) {
      for (let j = minCylindreIndex; j <= maxCylindreIndex; j++) {
        const sphere = this.sphereValues[i];
        const cylindre = this.cylindreValues[j];
        
        if (this.hasStock(sphere, cylindre)) {
          const cellKey = `${sphere}|${cylindre}`;
          this.selectedCells.add(cellKey);
        }
      }
    }
  }

  isCellSelected(sphere: number, cylindre: number | null): boolean {
    const cellKey = `${sphere}|${cylindre}`;
    return this.selectedCells.has(cellKey);
  }

  applyBulkPrice(): void {
    if (this.bulkPrice <= 0) {
      this.snackBar.open('Please enter a valid price', 'Close', { duration: 3000 });
      return;
    }

    let appliedCount = 0;
    console.log('Selected cells:', Array.from(this.selectedCells));
    console.log('Article type:', this.data.article.type_stock);

    this.selectedCells.forEach(cellKey => {
      const [sphereStr, cylindreStr] = cellKey.split('|');
      const sphere = parseFloat(sphereStr);
      const cylindre = cylindreStr === 'null' ? null : parseFloat(cylindreStr);
      
      const entry = this.findEntry(sphere, cylindre);
      console.log(`Cell ${cellKey}: entry found=${!!entry}, hasStock=${entry?.hasStock}`);
      
      if (entry && entry.hasStock) {
        entry.prix_supplement = this.bulkPrice;
        entry.modified = true;
        appliedCount++;
      }
    });

    this.snackBar.open(`Applied price ${this.bulkPrice} to ${appliedCount} selected cells`, 'Close', { duration: 2000 });
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