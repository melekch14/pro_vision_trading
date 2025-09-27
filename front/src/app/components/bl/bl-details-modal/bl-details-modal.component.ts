import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Bl } from '../../../models/bl.model';
import { BlService } from '../../../services/bl.service';

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
  saving: boolean = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<BlDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Bl,
    private blService: BlService
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
    if (!this.blRecord.id) {
      this.error = 'Invalid record ID';
      return;
    }

    this.saving = true;
    this.error = null;

    // Prepare the data for update (exclude fields that shouldn't be updated)
    const updateData: Partial<Bl> = {
      numero: this.editedRecord.numero || '',
      date: this.editedRecord.date || '',
      code_tier: this.editedRecord.code_tier || '',
      nom_raison_social: this.editedRecord.nom_raison_social || '',
      total_ttc: this.editedRecord.total_ttc || 0,
      mode_paie: this.editedRecord.mode_paie || '',
      observation: this.editedRecord.observation || '',
      user_create: this.editedRecord.user_create || '',
      totreg: this.editedRecord.totreg || 0,
      deja_recu: this.editedRecord.deja_recu || 0,
      reste: this.editedRecord.reste || 0
    };

    this.blService.updateBl(this.blRecord.id.toString(), updateData).subscribe({
      next: (result) => {
        // Update the local record with the saved data
        this.blRecord = { ...this.blRecord, ...updateData } as Bl;
        this.isEditing = false;
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update BL record. Please try again.';
        this.saving = false;
        console.error('Update error:', error);
      }
    });
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
