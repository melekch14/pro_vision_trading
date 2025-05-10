import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './components/layout.component';
import { CustomersComponent } from './components/customers/customers.component';
import { OrdersComponent } from './components/orders/orders.component';
import { ArticleHierarchyComponent } from './components/article-hierarchy/article-hierarchy.component';
import { CustomerFormComponent } from './components/customer-form/customer-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'app',
    component: LayoutComponent,
    children: [
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/new', component: CustomerFormComponent },
      { path: 'customers/:id', component: CustomerFormComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'article-hierarchy', component: ArticleHierarchyComponent },
      { path: 'dashboard', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'projects', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'messages', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'analytics', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'settings', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'products', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'reports', redirectTo: 'customers', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
