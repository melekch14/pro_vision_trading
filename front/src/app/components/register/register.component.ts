import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent {
  user = {
    raisonSociale: '',
    email: '',
    password: '',
    responsable: '',
    phone: '',
    adresse: ''
  };

  submitted = false;
  registrationError = '';

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      const payload = {
        raison_social: this.user.raisonSociale,
        email: this.user.email,
        password: this.user.password,
        responsable: this.user.responsable,
        tel: this.user.phone,
        adresse: this.user.adresse
      };

      this.authService.registerClient(payload).subscribe({
        next: () => this.router.navigate(['/login']),
        error: (err) => {
          this.registrationError = err.error?.message || 'Registration failed';
        }
      });
    }
  }
}
