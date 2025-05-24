import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuItem } from '../../shared/models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    { 
      id: 1, 
      title: 'Products', 
      icon: 'inventory_2',
      route: '/app/article-manager'
    },
    { 
      id: 2, 
      title: 'Orders', 
      icon: 'shopping_cart',
      route: '/app/orders'
    },
    { 
      id: 3, 
      title: 'Customers', 
      icon: 'people',
      route: '/app/customers'
    },
    { 
      id: 4, 
      title: 'Suppliers', 
      icon: 'local_shipping',
      route: '/app/fournisseurs'
    },
    { 
      id: 5, 
      title: 'Article Hierarchy', 
      icon: 'account_tree',
      route: '/app/article-hierarchy'
    },
    { 
      id: 6, 
      title: 'Article Parameters', 
      icon: 'settings',
      route: '/app/article-params'
    },
    { 
      id: 7, 
      title: 'Settings', 
      icon: 'settings_applications',
      route: '/app/settings'
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
    if (!this.userData) return '';
    const { nom, prenom } = this.userData;
    const fullName = `${prenom || ''} ${nom || ''}`.trim();
    return fullName.split(' ').map(name => 
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    ).join(' ');
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