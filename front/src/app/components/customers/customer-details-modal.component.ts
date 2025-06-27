import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Customer } from '../../shared/models/customer.model';

@Component({
  selector: 'app-customer-details-modal',
  templateUrl: './customer-details-modal.component.html',
  styleUrls: ['./customer-details-modal.component.css'],
  standalone: false
})
export class CustomerDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CustomerDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer }
  ) {}

  onAccept() {
    this.dialogRef.close('approved');
  }

  onDecline() {
    this.dialogRef.close('rejected');
  }

  onClose() {
    this.dialogRef.close();
  }
} 