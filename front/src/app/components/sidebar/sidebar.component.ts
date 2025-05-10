import { Component } from '@angular/core';
import { MenuItem } from '../../shared/models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { 
      id: 1, 
      title: 'Dashboard', 
      icon: 'dashboard',
      route: '/app/dashboard'
    },
    { 
      id: 2, 
      title: 'Projects', 
      icon: 'work',
      route: '/app/projects'
    },
    { 
      id: 3, 
      title: 'Messages', 
      icon: 'chat',
      route: '/app/messages'
    },
    { 
      id: 4, 
      title: 'Analytics', 
      icon: 'analytics',
      route: '/app/analytics'
    },
    { 
      id: 5, 
      title: 'Settings', 
      icon: 'settings',
      route: '/app/settings'
    },
    { 
      id: 6, 
      title: 'Products', 
      icon: 'inventory_2',
      route: '/app/products'
    },
    { 
      id: 7, 
      title: 'Orders', 
      icon: 'shopping_cart',
      route: '/app/orders'
    },
    { 
      id: 8, 
      title: 'Customers', 
      icon: 'people',
      route: '/app/customers'
    },
    { 
      id: 9, 
      title: 'Reports', 
      icon: 'assessment',
      route: '/app/reports'
    },
    { 
      id: 10, 
      title: 'Article Hierarchy', 
      icon: 'account_tree',
      route: '/app/article-hierarchy'
    }
  ];
}