import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './components/layout.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CustomersComponent } from './components/customers/customers.component';
import { OrdersComponent } from './components/orders/orders.component';
import { ArticleHierarchyComponent } from './components/article-hierarchy/article-hierarchy.component';
import { CustomerFormComponent } from './components/customer-form/customer-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ArticleManagerComponent } from './components/article-manager/article-manager.component';
import { ArticleParamsComponent } from './components/article-params/article-params.component';
import { FournisseurComponent } from './components/fournisseur/fournisseur.component';
import { SettingsComponent } from './components/settings/settings.component';
import { OpticienComponent } from './components/opticien/opticien.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Client Components
import { ClientLayoutComponent } from './components/client-layout/client-layout.component';
import { ClientSidebarComponent } from './components/client-sidebar/client-sidebar.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ClientCreateOrderComponent } from './components/client-create-order/client-create-order.component';
import { ClientOrdersComponent } from './components/client-orders/client-orders.component';
import { ClientProfileComponent } from './components/client-profile/client-profile.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidebarComponent,
    CustomersComponent,
    OrdersComponent,
    ArticleHierarchyComponent,
    CustomerFormComponent,
    LoginComponent,
    RegisterComponent,
    ArticleManagerComponent,
    ArticleParamsComponent,
    FournisseurComponent,
    SettingsComponent,
    OpticienComponent,
    // Client Components
    ClientLayoutComponent,
    ClientSidebarComponent,
    ClientDashboardComponent,
    ClientCreateOrderComponent,
    ClientOrdersComponent,
    ClientProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
