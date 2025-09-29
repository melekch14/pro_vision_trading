import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlService } from '../../../services/bl.service';

@Component({
  selector: 'app-bl-import-modal',
  templateUrl: './bl-import-modal.component.html',
  styleUrls: ['./bl-import-modal.component.scss'],
  standalone: false
})
export class BlImportModalComponent {
  selectedFile: File | null = null;
  uploading: boolean = false;
  uploadResult: any = null;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<BlImportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private blService: BlService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check if it's an Excel file
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        this.selectedFile = file;
        this.error = null;
        this.uploadResult = null;
      } else {
        this.error = 'Please select a valid Excel file (.xlsx or .xls)';
        this.selectedFile = null;
      }
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a file to upload';
      return;
    }

    this.uploading = true;
    this.error = null;

    this.blService.importBlFromExcel(this.selectedFile).subscribe({
      next: (result) => {
        this.uploadResult = result;
        this.uploading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to import file. Please try again.';
        this.uploading = false;
        console.error('Import error:', error);
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close(this.uploadResult ? true : false);
  }

  downloadTemplate(): void {
    // Create a sample Excel template
    const templateData = [
      ['NUMERO', 'DATE', 'Code Tier', 'Nom / Raison Social', 'Total TTC', 'MODE PAIE', 'Observation', 'USERCREATE', 'TOTREG', 'DEJARECU', 'RESTE'],
      ['250000002247', '2024-01-15', '3', 'OPTIKA', '14000', '', '', 'DAKAR', '0', '0', '14000'],
      ['250000002246', '2024-01-15', '66', 'ZOOM OPTIQUE', '28000', '', '', 'DAKAR', '0', '0', '28000']
    ];

    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bl_template.csv');
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

