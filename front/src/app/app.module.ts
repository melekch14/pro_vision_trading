import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

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
import { HttpClientModule } from '@angular/common/http';
import { ArticleManagerComponent } from './components/article-manager/article-manager.component';
import { StockDialogComponent } from './components/article-manager/stock-dialog/stock-dialog.component';
import { ArticleParamsComponent } from './components/article-params/article-params.component';
import { FournisseurComponent } from './components/fournisseur/fournisseur.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { AuthInterceptor } from './interceptors/auth.interceptor';

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
    StockDialogComponent,
    ArticleParamsComponent,
    FournisseurComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
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
    MatFormField,
    MatLabel,
    MatOption,
    MatIcon,
    MatProgressSpinnerModule,
    MatTooltipModule
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
