import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MenubarModule, ButtonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  menuItems: MenuItem[] = [];

  constructor(public auth: AuthService) {
    this.menuItems = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
      { label: 'Customers', icon: 'pi pi-users', routerLink: '/customers' },
      { label: 'Orders', icon: 'pi pi-shopping-bag', routerLink: '/orders' },
      ...(this.auth.isOwner()
        ? [{ label: 'Staff', icon: 'pi pi-id-card', routerLink: '/staff' }]
        : []),
    ];
  }
}
