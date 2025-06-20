import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { PlexServer } from '../../interfaces/plex-server';
import { UtilsService } from '../../services/utils.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { Category } from '../../interfaces/category';
import { SearchResult, SeasonType } from '../../interfaces/search-result';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-browse',
  imports: [
    ToastModule,
    CommonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    DrawerModule,
    CardModule,
    TagModule,
    ChipModule,
    DialogModule,
    ProgressSpinnerModule,
    TextareaModule,
    SelectButtonModule,
  ],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.css',
  providers: [MessageService],
})
export class BrowseComponent {
  selectedServer: PlexServer | null = null;
  isCheckingConnection = true;
  isOnline = false;
  isSearching = false;

  showList = false;

  listOptions = [
    { name: 'Default', value: false },
    { name: 'Show URL list', value: true },
  ];

  showFilterModal: boolean = false;
  selectedDownload: SearchResult | undefined = undefined;
  showDownloadModal: boolean = false;
  isLoadingDownload: boolean = false;
  downloadData: SeasonType[] | undefined = undefined;

  searchString: string = '';
  categories: Category[] = [
    { name: 'All', value: 'all' },
    { name: 'Movies', value: 'movie' },
    { name: 'TV Shows', value: 'show' },
    { name: 'Episode', value: 'episode' },
  ];
  selectedCategory: Category | undefined = undefined;

  searchResults: SearchResult[] | undefined = undefined;

  constructor(
    private messageService: MessageService,
    private utilsService: UtilsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('selectedServer');
    if (!stored) {
      this.messageService.add({
        severity: 'error',
        summary: 'No Server Selected',
        detail: 'Please select a Plex server first.',
      });
      this.router.navigate(['/setup']);
      return;
    }

    this.selectedServer = JSON.parse(stored);
    console.log(this.selectedServer);

    if (!this.selectedServer) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Server',
        detail: 'The selected Plex server is invalid.',
      });
      this.router.navigate(['/setup']);
      return;
    }

    this.utilsService
      .isServerOnline(this.selectedServer)
      .then((online) => {
        this.isCheckingConnection = false;
        this.isOnline = online;

        if (!online) {
          this.messageService.add({
            severity: 'error',
            summary: 'Server Offline',
            detail: 'The selected Plex server is not reachable.',
          });
          this.router.navigate(['/setup']);
        }
      })
      .catch((err) => {
        this.isCheckingConnection = false;
        console.error('Error checking server status:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to check server connection.',
        });
        this.router.navigate(['/setup']);
      });
  }

  performSearch(query: string): void {
    this.isSearching = true;
    this.searchResults = undefined;
    this.utilsService
      .searchPlex(query)
      .then((results) => {
        this.searchResults = results.filter(
          (item) => item.type === 'show' || item.type === 'movie'
        );
        this.isSearching = false;
        console.log('Search results:', this.searchResults);
      })
      .catch((error) => {
        console.error('Search error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Search Error',
          detail: 'An error occurred while searching.',
        });
        this.isSearching = false;
      });
  }

  resetFilter(): void {
    this.selectedCategory = undefined;
    this.showFilterModal = false;
  }

  getRatingSeverity(rating: string): 'success' | 'info' | 'warn' | 'danger' {
    const value = parseFloat(rating);
    if (isNaN(value)) return 'info';

    if (value >= 8) return 'success';
    if (value >= 6) return 'info';
    if (value >= 4) return 'warn';
    return 'danger';
  }

  downloadMedia(media: SearchResult) {
    console.log('Downloading media:', media);
    if (media.downloadUrl) {
      window.open(media.downloadUrl, '_blank');
    } else {
      this.isLoadingDownload = true;
      this.selectedDownload = media;
      this.showDownloadModal = true;
      this.utilsService
        .getShowDownloadDetails(media)
        .then((details) => {
          this.isLoadingDownload = false;
          this.downloadData = details;
          console.log(details);
        })
        .catch((error) => {
          this.isLoadingDownload = false;
          console.error('Error fetching download details:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Download Error',
            detail: 'An error occurred while fetching download details.',
          });
          this.selectedDownload = undefined;
        });
    }
  }

  closeModal() {
    this.showDownloadModal = false;
    this.selectedDownload = undefined;
  }

  getAllDownloadUrls(data: SeasonType[] = []): string {
    if (!data) return '';

    return data
      .flatMap((group) => group.episodes.map((ep) => ep.downloadUrl))
      .join('\n');
  }
}
