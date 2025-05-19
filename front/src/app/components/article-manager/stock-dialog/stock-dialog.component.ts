import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Article } from '../../../services/article.service';
import { StockService, StockEntry as ApiStockEntry } from '../../../services/stock.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DialogStockEntry {
  sphere: number;
  cylindre: number;
  quantite: number;
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
          quantite: 0
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
          const cylindre = parseFloat(entry.cylindre.toString());
          const stockEntry = this.stockEntries.find(
            e => Math.abs(e.sphere - sphere) < 0.001 && Math.abs(e.cylindre - cylindre) < 0.001
          );
          if (stockEntry) {
            stockEntry.quantite = entry.quantite;
            console.log('Updated stock entry:', { sphere, cylindre, quantite: entry.quantite });
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
      const entryCylindre = parseFloat(entry.cylindre.toString());
      return Math.abs(entrySphere - sphere) < 0.001 && 
             Math.abs(entryCylindre - cylindre) < 0.001 && 
             entry.quantite > 0;
    });
  }

  getQuantity(sphere: number, cylindre: number): number {
    const entry = this.stockEntries.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && Math.abs(e.cylindre - cylindre) < 0.001
    );
    return entry ? entry.quantite : 0;
  }

  onQuantityChange(sphere: number, cylindre: number, value: number): void {
    const entry = this.stockEntries.find(
      e => Math.abs(e.sphere - sphere) < 0.001 && Math.abs(e.cylindre - cylindre) < 0.001
    );
    
    if (entry) {
      entry.quantite = value || 0;
      const existingEntry = this.existingStock.find(e => {
        const entrySphere = parseFloat(e.sphere.toString());
        const entryCylindre = parseFloat(e.cylindre.toString());
        return Math.abs(entrySphere - sphere) < 0.001 && Math.abs(entryCylindre - cylindre) < 0.001;
      });
      if (existingEntry) {
        existingEntry.quantite = value || 0;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const entriesToSave = this.stockEntries.filter(entry => entry.quantite > 0);
    this.dialogRef.close(entriesToSave);
  }
}
