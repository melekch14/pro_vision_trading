import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent {
  user = {
    email: '',
    password: ''
  };

  submitted = false;
  loginError = '';

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
      this.authService.loginUser(this.user).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          this.router.navigate(['/app']); // Redirect to dashboard or main app
        },
        error: (err) => {
          this.loginError = err.error?.message || 'Invalid login credentials';
        }
      });
    }
  }
}
