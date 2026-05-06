import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'customers',
        loadComponent: () => import('./pages/customers/customer-list.component').then(m => m.CustomerListComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders-list.component').then(m => m.OrdersListComponent),
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./pages/orders/order-create.component').then(m => m.OrderCreateComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/orders/order-detail.component').then(m => m.OrderDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
