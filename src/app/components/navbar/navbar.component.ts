import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { UtilsService } from '../../services/utils.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-navbar',
  imports: [ButtonModule, CommonModule, SelectModule, ToastModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  providers: [MessageService, UtilsService]
})

export class NavbarComponent implements OnInit, OnDestroy {

  isLoading: boolean = false;
  isLoggedIn: boolean = false;
  private routerSubscription: Subscription | undefined;
  showChangeServerButton: boolean = false;

  constructor(
    private utilsService: UtilsService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
  this.checkRouteAndLoginStatus();

  this.routerSubscription = this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.checkRouteAndLoginStatus();
    }
  });

  }

  ngOnDestroy() {
    // Prevent memory leaks
    this.routerSubscription?.unsubscribe();
  }

  logout() {
    this.utilsService.logout();
    this.messageService.add({
      severity: 'success',
      summary: 'Logout Successful',
      detail: 'You have been logged out.'
    });
    this.isLoggedIn = false;
  }

  changeServer() {
    localStorage.removeItem('selectedServer');
    this.router.navigate(['/setup']);
  }

  private checkRouteAndLoginStatus() {
  this.utilsService.isLoggedIn().then(isLoggedIn => {
    this.isLoggedIn = isLoggedIn;

    // Check if the current route is '/browse'
    this.showChangeServerButton = this.router.url === '/browse';
  }).catch(error => {
    console.error('Error checking login status:', error);
  });
}
}
