import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    { 
      id: 'article-manager',
      name: 'Article Manager',
      icon: 'inventory_2',
      route: '/app/article-manager'
    },
    { 
      id: 'article-hierarchy',
      name: 'Article Hierarchy',
      icon: 'account_tree',
      route: '/app/article-hierarchy'
    },
    { 
      id: 'article-params',
      name: 'Article Parameters',
      icon: 'settings',
      route: '/app/article-params'
    },
    { 
      id: 'orders',
      name: 'Orders',
      icon: 'shopping_cart',
      route: '/app/orders'
    },
    { 
      id: 'customers',
      name: 'Customers',
      icon: 'people',
      route: '/app/customers'
    },
    { 
      id: 'fournisseurs',
      name: 'Suppliers',
      icon: 'local_shipping',
      route: '/app/fournisseurs'
    },
    { 
      id: 'opticiens',
      name: 'Opticians',
      icon: 'person',
      route: '/app/opticiens'
    },
    { 
      id: 'settings',
      name: 'Settings',
      icon: 'settings_applications',
      route: '/app/settings'
    }
  ];

  userData: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    this.permissionService.loadUserPermissions().subscribe();
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

  hasAccess(componentId: string): boolean {
    return this.permissionService.hasAccess(componentId);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.permissionService.clearPermissions();
    this.router.navigate(['/login']);
  }
}