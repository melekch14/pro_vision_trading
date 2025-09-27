import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Bl } from '../../../models/bl.model';

@Component({
  selector: 'app-bl-details-modal',
  templateUrl: './bl-details-modal.component.html',
  styleUrls: ['./bl-details-modal.component.scss'],
  standalone: false
})
export class BlDetailsModalComponent {
  blRecord: Bl;
  isEditing: boolean = false;
  editedRecord: Partial<Bl> = {};

  constructor(
    public dialogRef: MatDialogRef<BlDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Bl
  ) {
    this.blRecord = data;
    this.editedRecord = { ...data };
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset changes if canceling edit
      this.editedRecord = { ...this.blRecord };
    }
  }

  saveChanges(): void {
    // Here you would typically call a service to update the record
    // For now, we'll just close the dialog
    this.dialogRef.close(true);
  }

  formatCurrency(amount: number): string {
    return amount ? amount.toLocaleString('fr-FR') + ' CFA' : '0 CFA';
  }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }

  closeDialog(): void {
    this.dialogRef.close(false);
  }
}
