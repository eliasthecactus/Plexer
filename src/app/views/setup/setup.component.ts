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
import { SelectModule } from 'primeng/select';
import { PlexServer } from '../../interfaces/plex-server';

@Component({
  selector: 'app-setup',
  imports: [
    ToastModule,
    CardModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    PasswordModule,
    SelectModule,
  ],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
  providers: [MessageService],
})
export class SetupComponent {
  isLoading: boolean = true;
  isFetchingServers: boolean = false;
  servers: PlexServer[] = [];

  constructor(
    private messageService: MessageService,
    private utilsService: UtilsService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.utilsService
      .isLoggedIn()
      .then((isLoggedIn) => {
        if (isLoggedIn) {
          this.isLoading = false;
        } else {
          window.location.href = document.getElementsByTagName('base')[0].href + 'auth';
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
          this.fetchPlexServers();

  }

  fetchPlexServers() {
    this.isFetchingServers = true;
    this.utilsService
      .getPlexServers()
      .then((servers) => {
        this.servers = servers;
        console.log('Fetched servers:', this.servers);
        for (const server of this.servers) {
          console.log('Checking server:', server);
          this.utilsService.isServerOnline(server).then((online) => {
            server.online = online;
            server.isChecked = true;
          });
        }
        this.isFetchingServers = false;
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch Plex servers.',
        });
        console.error('Fetch servers error:', error);
        this.isFetchingServers = false;
      });
  }

  selectServer(server: PlexServer): void {
    if (server.isChecked && server.online) {
      localStorage.setItem('selectedServer', JSON.stringify(server));
      this.router.navigate(['/browse'], );
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Server Unavailable',
        detail: 'Please select a valid and online server.',
      });
    }
  }
}
