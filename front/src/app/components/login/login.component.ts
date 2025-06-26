import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

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

  constructor(
    private router: Router, 
    private authService: AuthService,
    private permissionService: PermissionService
  ) {
    // Redirect to appropriate dashboard if already logged in
    if (this.authService.isAuthenticated()) {
      const userData = this.authService.getUserData();
      if (userData?.role === 'client') {
        console.log(userData);
        this.router.navigate(['/client/create-order']);
      } else {
        this.router.navigate(['/app/dashboard']);
      }
    }
  }

  onSubmit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
      this.authService.loginUser(this.user).subscribe({
        next: () => {
          // Load permissions after successful login
          this.permissionService.loadUserPermissions().subscribe(() => {
            const userData = this.authService.getUserData();
            if (userData?.role === 'client') {
              this.authService.decodeAndDisplayClientInfo();
              this.router.navigate(['/client/create-order']);
            } else {
              this.router.navigate(['/app/dashboard']);
            }
          });
        },
        error: (err) => {
          this.loginError = err.error?.error || err.error?.message || 'Invalid login credentials';
        }
      });
    }
  }
}
