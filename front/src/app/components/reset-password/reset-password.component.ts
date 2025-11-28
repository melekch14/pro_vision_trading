import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: false
})
export class ResetPasswordComponent {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';
  loading = false;

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  resetPassword() {
    this.error = '';
    this.message = '';
    if (!this.token || !this.newPassword || !this.confirmPassword) {
      this.error = 'All fields are required.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    console.log(this.token);
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.message = 'Le mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Échec de la réinitialisation du mot de passe.';
        this.loading = false;
      }
    });
  }
} 