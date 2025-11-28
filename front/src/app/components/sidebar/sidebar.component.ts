import { Component, OnInit, HostListener } from '@angular/core';
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
      id: 'dashboard',
      name: 'Tableau de bord',
      icon: 'dashboard',
      route: '/app/dashboard'
    },
    {
      id: 'article-manager',
      name: 'Gestion des articles',
      icon: 'inventory_2',
      route: '/app/article-manager'
    },
    {
      id: 'article-hierarchy',
      name: 'Hiérarchie des articles',
      icon: 'account_tree',
      route: '/app/article-hierarchy'
    },
    {
      id: 'article-params',
      name: 'Paramètres des articles',
      icon: 'settings',
      route: '/app/article-params'
    },
    {
      id: 'orders',
      name: 'Commandes',
      icon: 'shopping_cart',
      route: '/app/orders'
    },
    {
      id: 'bl',
      name: 'Bon de Livraison',
      icon: 'receipt_long',
      route: '/app/bl'
    },
    {
      id: 'tickets',
      name: 'Tickets',
      icon: 'confirmation_number',
      route: '/app/tickets'
    },
    {
      id: 'customers',
      name: 'Clients',
      icon: 'people',
      route: '/app/customers'
    },
    {
      id: 'profile-update-requests',
      name: 'Demandes de modification',
      icon: 'pending_actions',
      route: '/app/profile-update-requests'
    },
    {
      id: 'fournisseurs',
      name: 'Fournisseurs',
      icon: 'local_shipping',
      route: '/app/fournisseurs'
    },
    {
      id: 'opticiens',
      name: 'Opticiens',
      icon: 'person',
      route: '/app/opticiens'
    },
    {
      id: 'activity-history',
      name: 'Historique des activités',
      icon: 'history',
      route: '/app/activity-history'
    },
    {
      id: 'settings',
      name: 'Paramètres',
      icon: 'settings_applications',
      route: '/app/settings'
    },
  ];

  userData: any = null;
  isCollapsed: boolean = false;
  isMobileOpen: boolean = false;
  isMobileView: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    this.permissionService.loadUserPermissions().subscribe();
    this.checkMobileView();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.isMobileOpen = false;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleMobile(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobile(): void {
    this.isMobileOpen = false;
  }

  onNavClick(): void {
    if (this.isMobileView) {
      this.closeMobile();
    }
  }

  getInitials(): string {
    if (!this.userData) return '?';
    const { nom, prenom } = this.userData;
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || '?';
  }

  getUserName(): string {
    if (!this.userData) return 'Utilisateur';
    const { nom, prenom } = this.userData;
    const fullName = `${prenom || ''} ${nom || ''}`.trim();
    return fullName.split(' ').map(name =>
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    ).join(' ') || 'Utilisateur';
  }

  getUserRole(): string {
    if (!this.userData) return 'Invité';
    const role = this.userData.role || '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() || 'Invité';
  }

  getUserAvatar(): string | null {
    // Return user avatar URL if available, otherwise null for default
    if (this.userData && this.userData.avatar_url) {
      return this.userData.avatar_url;
    }
    return null;
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
