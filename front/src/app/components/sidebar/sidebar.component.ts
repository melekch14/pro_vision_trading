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
    }
  ];
}