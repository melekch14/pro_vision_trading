import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpticienService, Opticien } from '../../services/opticien.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-opticien',
  templateUrl: './opticien.component.html',
  styleUrls: ['./opticien.component.scss'],
  standalone: false
})
export class OpticienComponent implements OnInit {
  opticiens: Opticien[] = [];
  opticienForm: FormGroup;
  isEditing = false;
  selectedOpticienId: number | null = null;
  roles = ['opticien', 'technicien'];

  constructor(
    private opticienService: OpticienService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.opticienForm = this.fb.group({
      codee: ['', Validators.required],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOpticiens();
  }

  loadOpticiens(): void {
    this.opticienService.getAllOpticiens().subscribe({
      next: (data) => {
        this.opticiens = data;
      },
      error: (error) => {
        this.showMessage('Error loading opticiens');
      }
    });
  }

  onSubmit(): void {
    if (this.opticienForm.valid) {
      const opticienData = this.opticienForm.value;
      
      if (this.isEditing && this.selectedOpticienId) {
        this.opticienService.updateOpticien(this.selectedOpticienId, opticienData).subscribe({
          next: () => {
            this.showMessage('Opticien updated successfully');
            this.resetForm();
            this.loadOpticiens();
          },
          error: (error) => {
            this.showMessage('Error updating opticien');
          }
        });
      } else {
        this.opticienService.createOpticien(opticienData).subscribe({
          next: () => {
            this.showMessage('Opticien created successfully');
            this.resetForm();
            this.loadOpticiens();
          },
          error: (error) => {
            this.showMessage('Error creating opticien');
          }
        });
      }
    }
  }

  editOpticien(opticien: Opticien): void {
    this.isEditing = true;
    this.selectedOpticienId = opticien.id!;
    this.opticienForm.patchValue({
      codee: opticien.codee,
      nom: opticien.nom,
      prenom: opticien.prenom,
      email: opticien.email,
      role: opticien.role
    });
    // Don't set password when editing
    this.opticienForm.get('password')?.clearValidators();
    this.opticienForm.get('password')?.updateValueAndValidity();
  }

  deleteOpticien(id: number): void {
    if (confirm('Are you sure you want to delete this opticien?')) {
      this.opticienService.deleteOpticien(id).subscribe({
        next: () => {
          this.showMessage('Opticien deleted successfully');
          this.loadOpticiens();
        },
        error: (error) => {
          this.showMessage('Error deleting opticien');
        }
      });
    }
  }

  resetForm(): void {
    this.opticienForm.reset();
    this.isEditing = false;
    this.selectedOpticienId = null;
    this.opticienForm.get('password')?.setValidators([Validators.required]);
    this.opticienForm.get('password')?.updateValueAndValidity();
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
} 