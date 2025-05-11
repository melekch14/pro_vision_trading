import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

interface StockEntry {
  sphere: number;
  cylindre: number;
  quantity: number;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: false,
  templateUrl: './stock-dialog.component.html',
  styleUrl: './stock-dialog.component.scss'
})
export class StockDialogComponent implements OnInit {
  stockForm: FormGroup;
  sphereValues: number[] = Array.from({length: 20}, (_, i) => -2 + (i * 0.25));
  cylindreValues: number[] = Array.from({length: 10}, (_, i) => -2 + (i * 0.25));
  stockEntries: { [key: string]: number } = {};

  constructor(
    private dialogRef: MatDialogRef<StockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.stockForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Initialize stock entries
    this.sphereValues.forEach(sphere => {
      this.cylindreValues.forEach(cylindre => {
        const key = `${sphere}_${cylindre}`;
        this.stockEntries[key] = 0;
        this.stockForm.addControl(key, this.fb.control(0));
      });
    });
  }

  getQuantity(sphere: number, cylindre: number): number {
    const key = `${sphere}_${cylindre}`;
    return this.stockEntries[key] || 0;
  }

  onQuantityChange(sphere: number, cylindre: number, event: any): void {
    const key = `${sphere}_${cylindre}`;
    this.stockEntries[key] = event.target.value;
  }

  onSubmit(): void {
    const stockData = Object.entries(this.stockEntries).map(([key, quantity]) => {
      const [sphere, cylindre] = key.split('_').map(Number);
      return { sphere, cylindre, quantity };
    });
    this.dialogRef.close(stockData);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
