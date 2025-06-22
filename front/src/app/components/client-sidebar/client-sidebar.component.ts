import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuItem } from '../../shared/models/menu-item.model';

@Component({
  selector: 'app-client-sidebar',
  templateUrl: './client-sidebar.component.html',
  styleUrls: ['./client-sidebar.component.css'],
  standalone: false
})
export class ClientSidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    { 
      id: 2, 
      title: 'Create Order', 
      icon: 'add_shopping_cart',
      route: '/client/create-order'
    },
    { 
      id: 3, 
      title: 'My Orders', 
      icon: 'shopping_cart',
      route: '/client/orders'
    },
    { 
      id: 4, 
      title: 'Profile', 
      icon: 'person',
      route: '/client/profile'
    }
  ];

  userData: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
  }

  getInitials(): string {
    if (!this.userData) return '';
    const { nom, prenom } = this.userData;
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  }

  getUserName(): string {
    console.log(this.userData);
    if (!this.userData) return '';
    const { raison_social } = this.userData;
    return raison_social;
  }

  getUserRole(): string {
    if (!this.userData) return '';
    const role = this.userData.role || '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 