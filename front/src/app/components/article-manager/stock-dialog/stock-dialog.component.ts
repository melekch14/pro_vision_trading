import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Article } from '../../../services/article.service';
import { StockService, StockEntry as ApiStockEntry } from '../../../services/stock.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DialogStockEntry {
  sphere: number;
  cylindre: number | null;
  quantite: number;
  addition?: number | null;
  modified?: boolean;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: false,
  templateUrl: './stock-dialog.component.html',
  styleUrl: './stock-dialog.component.scss'
})
export class StockDialogComponent implements OnInit {
  sphereValues: number[] = Array.from({length: 33}, (_, i) => -4 + (i * 0.25));
  cylindreValues: number[] = Array.from({length: 9}, (_, i) => -2 + (i * 0.25));
  stockEntries: DialogStockEntry[] = [];
  existingStock: ApiStockEntry[] = [];

  constructor(
    public dialogRef: MatDialogRef<StockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { article: Article },
    private stockService: StockService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeStockEntries();
    this.loadExistingStock();
  }

  private initializeStockEntries(): void {
    this.stockEntries = [];
    this.sphereValues.forEach(sphere => {
      this.cylindreValues.forEach(cylindre => {
        this.stockEntries.push({
          sphere,
          cylindre,
          quantite: 0,
          modified: false
        });
      });
    });
  }

  private loadExistingStock(): void {
    this.stockService.getStockByArticleId(this.data.article.id!).subscribe({
      next: (entries) => {
        this.existingStock = entries;
        entries.forEach(entry => {
          const sphere = parseFloat(entry.sphere.toString());
          const value = this.data.article.type_stock === 'addition' ? entry.addition : entry.cylindre;
          const stockEntry = this.stockEntries.find(
            e => Math.abs(e.sphere - sphere) < 0.001 && 
                 (value === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - value) < 0.001))
          );
          if (stockEntry) {
            stockEntry.quantite = entry.quantite;
            stockEntry.addition = entry.addition;
            stockEntry.modified = false;
            console.log('Updated stock entry:', { sphere, value, quantite: entry.quantite, addition: entry.addition });
          }
        });
        console.log('All stock entries:', this.stockEntries);
      },
      error: (error) => {
        console.error('Error loading stock:', error);
        this.snackBar.open('Error loading stock', 'Close', { duration: 3000 });
      }
    });
  }

  hasExistingStock(sphere: number, cylindre: number): boolean {
    return this.existingStock.some(entry => {
      const entrySphere = parseFloat(entry.sphere.toString());
      const value = this.data.article.type_stock === 'addition' ? entry.addition : entry.cylindre;
      return Math.abs(entrySphere - sphere) < 0.001 && 
             (value === null ? cylindre === null : Math.abs(value - cylindre) < 0.001) && 
             entry.quantite > 0;
    });
  }

  getQuantity(sphere: number, cylindre: number): number {
    const entry = this.stockEntries.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    return entry ? entry.quantite : 0;
  }

  onQuantityChange(sphere: number, cylindre: number, value: number): void {
    const entry = this.stockEntries.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && 
           (cylindre === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - cylindre) < 0.001))
    );
    
    if (entry) {
      const oldValue = entry.quantite;
      entry.quantite = value || 0;
      entry.modified = true;
      
      const existingEntry = this.existingStock.find(e => {
        const entrySphere = parseFloat(e.sphere.toString());
        const value = this.data.article.type_stock === 'addition' ? e.addition : e.cylindre;
        return Math.abs(entrySphere - sphere) < 0.001 && 
               (value === null ? cylindre === null : Math.abs(value - cylindre) < 0.001);
      });
      
      if (existingEntry) {
        existingEntry.quantite = value || 0;
      }
      
      console.log('Quantity changed:', {
        sphere,
        cylindre,
        oldValue,
        newValue: value,
        modified: entry.modified
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.data.article.id) {
      this.snackBar.open('Article ID is missing', 'Close', { duration: 3000 });
      return;
    }

    // Get all entries with quantity > 0 or modified entries
    const entriesToSave = this.stockEntries.filter(entry => entry.quantite > 0 || entry.modified);
    console.log('Entries to save:', entriesToSave);
    
    const updates: ApiStockEntry[] = [];
    const insertions: ApiStockEntry[] = [];

    entriesToSave.forEach(entry => {
      const existingEntry = this.existingStock.find(e => {
        const entrySphere = parseFloat(e.sphere.toString());
        // For addition type, we compare with the addition value
        const value = this.data.article.type_stock === 'addition' ? e.addition : e.cylindre;
        return Math.abs(entrySphere - entry.sphere) < 0.001 && 
               (value === null ? entry.cylindre === null : (entry.cylindre !== null && Math.abs(value - entry.cylindre) < 0.001));
      });

      console.log('Checking entry:', entry, 'Existing entry:', existingEntry);

      const stockEntry: ApiStockEntry = {
        article_id: this.data.article.id!,
        sphere: entry.sphere,
        cylindre: this.data.article.type_stock === 'cylindre' ? entry.cylindre : null,
        addition: this.data.article.type_stock === 'addition' ? entry.cylindre : null,
        quantite: entry.quantite,
        type_stock: this.data.article.type_stock
      };

      console.log('Stock entry to save:', stockEntry);

      if (existingEntry) {
        // If the entry was modified, update it
        if (entry.modified) {
          console.log('Adding to updates (modified):', { ...stockEntry, id: existingEntry.id });
          updates.push({
            ...stockEntry,
            id: existingEntry.id
          });
        }
      } else if (entry.quantite > 0) {
        // Only insert if there's no existing entry and quantity > 0
        console.log('Adding to insertions:', stockEntry);
        insertions.push(stockEntry);
      }
    });

    // Handle entries that were set to 0 (deletions)
    const deletions: ApiStockEntry[] = this.existingStock.filter(existingEntry => {
      const entrySphere = parseFloat(existingEntry.sphere.toString());
      // For addition type, we compare with the addition value
      const value = this.data.article.type_stock === 'addition' ? existingEntry.addition : existingEntry.cylindre;
      const currentEntry = this.stockEntries.find(
        e => Math.abs(e.sphere - entrySphere) < 0.001 && 
             (value === null ? e.cylindre === null : (e.cylindre !== null && Math.abs(e.cylindre - value) < 0.001))
      );
      return currentEntry && currentEntry.quantite === 0;
    });

    console.log('Final result:', { updates, insertions, deletions });
    this.dialogRef.close({
      updates,
      insertions,
      deletions
    });
  }
}
