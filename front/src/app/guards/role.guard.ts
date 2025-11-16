import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const userData = this.authService.getUserData();
    
    if (!userData) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data['role'];
    
    // Special handling for app route which should allow both administrateur and assistant
    if (route.routeConfig?.path === 'app') {
      if (userData.role === 'administrateur' || userData.role === 'assistant') {
        return true;
      }
    } else if (userData.role === requiredRole) {
      return true;
    }

    // Redirect based on user role
    if (userData.role === 'client') {
      this.router.navigate(['/client/dashboard']);
    } else {
      this.router.navigate(['/app']);
    }
    
    return false;
  }
} 