import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { SidebarService } from '../../services/sidebar.service';
import { Subscription } from 'rxjs';

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
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  isMobile = false;
  private subscriptions = new Subscription();

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      name: 'Tableau de bord',
      icon: 'inventory_2',
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
      id: 'admin-client-orders',
      name: 'Commandes Clients',
      icon: 'shopping_bag',
      route: '/app/admin-client-orders'
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
      name: 'Equipe',
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    this.permissionService.loadUserPermissions().subscribe();
    
    this.checkMobile();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    this.subscriptions.add(
      this.sidebarService.isOpen$.subscribe(isOpen => {
        this.isOpen = isOpen;
      })
    );
  }

  private handleResize = () => {
    this.checkMobile();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.subscriptions.unsubscribe();
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.sidebarService.open();
    }
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarService.close();
    }
  }

  getInitials(): string {
    if (!this.userData) return '';
    const { nom, prenom } = this.userData;
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  }

  getUserName(): string {
    console.log(this.userData);
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
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  logout(): void {
    this.authService.logout();
    this.permissionService.clearPermissions();
    this.router.navigate(['/login']);
  }
}
