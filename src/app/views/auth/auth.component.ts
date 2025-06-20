import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-auth',
  imports: [
    ToastModule,
    CardModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    PasswordModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  providers: [MessageService, UtilsService],
})
export class AuthComponent {
  isLoading: boolean = true;
  isLoggingIn: boolean = false;

  username: string = '';
  password: string = '';

  constructor(
    private messageService: MessageService,
    private utils: UtilsService,
    private router: Router,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.utilsService
      .isLoggedIn()
      .then((isLoggedIn) => {
        if (isLoggedIn) {
          this.isLoading = false;
          this.router.navigate(['/setup']);
        } else {
          this.isLoading = false;
        }
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while checking login status.',
        });
        console.error('Login check error:', error);
        this.isLoading = false;
      });
  }

  login() {
    this.isLoading = true;
    this.utils
      .plexLogin(this.username, this.password)
      .then((success) => {
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Login Successful',
            detail: 'You are now logged in.',
          });
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => {
              this.router.navigate(['/setup']);
            });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid username or password.',
          });
        }
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred during login.',
        });
        console.error(error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
