import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './components/layout.component';
import { CustomersComponent } from './components/customers/customers.component';
import { OrdersComponent } from './components/orders/orders.component';
import { ArticleHierarchyComponent } from './components/article-hierarchy/article-hierarchy.component';
import { CustomerFormComponent } from './components/customer-form/customer-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ArticleManagerComponent } from './components/article-manager/article-manager.component';
import { ArticleParamsComponent } from './components/article-params/article-params.component';
import { FournisseurComponent } from './components/fournisseur/fournisseur.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { SettingsComponent } from './components/settings/settings.component';
import { OpticienComponent } from './components/opticien/opticien.component';
import { TicketsComponent } from './components/tickets/tickets.component';
import { ProfileUpdateRequestsComponent } from './components/profile-update-requests/profile-update-requests.component';

// Client Components
import { ClientLayoutComponent } from './components/client-layout/client-layout.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ClientCreateOrderComponent } from './components/client-create-order/client-create-order.component';
import { ClientOrdersComponent } from './components/client-orders/client-orders.component';
import { ClientProfileComponent } from './components/client-profile/client-profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { BlComponent } from './components/bl/bl.component';
import { ActivityHistoryComponent } from './components/activity-history/activity-history.component';
import { AdminClientOrdersComponent } from './components/admin-client-orders/admin-client-orders.component';

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
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'administrateur' },
    children: [
      { path: '', redirectTo: 'article-manager', pathMatch: 'full' },
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/new', component: CustomerFormComponent },
      { path: 'customers/:id', component: CustomerFormComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'tickets', component: TicketsComponent },
      { path: 'article-hierarchy', component: ArticleHierarchyComponent },
      { path: 'article-manager', component: ArticleManagerComponent },
      { path: 'article-params', component: ArticleParamsComponent },
      { path: 'fournisseurs', component: FournisseurComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'opticiens', component: OpticienComponent },
      { path: 'bl', component: BlComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile-update-requests', component: ProfileUpdateRequestsComponent },
      { path: 'activity-history', component: ActivityHistoryComponent },
      { path: 'admin-client-orders', component: AdminClientOrdersComponent },
      { path: 'create-order', component: ClientCreateOrderComponent }
    ]
  },
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'create-order', component: ClientCreateOrderComponent },
      { path: 'orders', component: ClientOrdersComponent },
      { path: 'profile', component: ClientProfileComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
