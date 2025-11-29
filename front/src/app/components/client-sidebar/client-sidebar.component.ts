import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { MenuItem } from '../../shared/models/menu-item.model';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-client-sidebar',
  templateUrl: './client-sidebar.component.html',
  styleUrls: ['./client-sidebar.component.css'],
  standalone: false
})
export class ClientSidebarComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [
    {
      id: 2,
      title: 'Créer une commande',
      icon: 'visibility',
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
  isOpen = false;
  isMobile = false;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
    this.checkMobile();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    // Subscribe to sidebar state
    const sidebarSub = this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
    });
    this.subscriptions.add(sidebarSub);

    // Close sidebar on navigation (only on mobile)
    const navSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile) {
          this.sidebarService.close();
        }
      });
    this.subscriptions.add(navSub);
  }

  private handleResize = () => {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    this.subscriptions.unsubscribe();
  }

  closeSidebar() {
    this.sidebarService.close();
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
