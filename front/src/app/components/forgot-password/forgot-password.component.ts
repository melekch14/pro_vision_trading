import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: false
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  message = '';
  error = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(form: NgForm) {
    this.submitted = true;
    this.error = '';
    this.message = '';

    if (form.valid) {
      this.loading = true;
      this.authService.requestPasswordReset(this.email).subscribe({
        next: () => {
          this.message = "Si un compte avec cet email existe, un lien de réinitialisation du mot de passe a été envoyé à votre adresse email.";
          this.loading = false;
        },
        error: (err) => {
          // Don't reveal if email exists or not for security reasons
          this.message = "Si un compte avec cet email existe, un lien de réinitialisation du mot de passe a été envoyé à votre adresse email.";
          this.loading = false;
        }
      });
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}