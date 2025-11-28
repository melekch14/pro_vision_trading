import { Component, OnInit, HostListener } from '@angular/core';
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
      title: 'Créer une commande',
      icon: 'add_shopping_cart',
      route: '/client/create-order'
    },
    {
      id: 3,
      title: 'Mes Commandes',
      icon: 'shopping_cart',
      route: '/client/orders'
    },
    {
      id: 4,
      title: 'Profil',
      icon: 'person',
      route: '/client/profile'
    }
  ];

  userData: any = null;
  isCollapsed: boolean = false;
  isMobileOpen: boolean = false;
  isMobileView: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userData = this.authService.getUserData();
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
    if (!this.userData) return 'Client';
    const { raison_social } = this.userData;
    return raison_social || 'Client';
  }

  getUserRole(): string {
    if (!this.userData) return 'Client';
    const role = this.userData.role || '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() || 'Client';
  }

  getUserAvatar(): string | null {
    if (this.userData && this.userData.avatar_url) {
      return this.userData.avatar_url;
    }
    return null;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
