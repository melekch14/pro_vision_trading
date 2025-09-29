import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomerService } from '../../../services/customer.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-customer-import-modal',
  templateUrl: './customer-import-modal.component.html',
  styleUrls: ['./customer-import-modal.component.scss'],
  standalone: false
})
export class CustomerImportModalComponent {
  selectedFile: File | null = null;
  uploading: boolean = false;
  uploadResult: any = null;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<CustomerImportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private customerService: CustomerService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (allowedTypes.includes(file.type)) {
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

    this.customerService.importCustomersFromExcel(this.selectedFile).subscribe({
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
    // Create a sample Excel template for customer import
    const templateData = [
      ['Code', 'Nom et Prénom', 'Adresse', 'Ville', 'Tél.', 'Fax', 'Risque'],
      ['0094', 'SEN OPTIC+', 'MERMOZE', 'DAKAR', '771493318', '', ''],
      ['0093', 'TOUBA OPTIQUE NDAMATOU', 'RUFISQUE', 'RUFISQUE', '773061027', '', ''],
      ['0082', 'LUNETTERIE MOUHAMED', 'CHAMP DE COURSE', 'SALY', '782011760', '', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    XLSX.writeFile(wb, 'modele_import_clients.xlsx');
  }
}
