import { Routes } from '@angular/router';
import { AuthComponent } from './views/auth/auth.component';
import { SetupComponent } from './views/setup/setup.component';
import { BrowseComponent } from './views/browse/browse.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent,
  },
  {
    path: 'setup',
    component: SetupComponent,
  },
  {
    path: 'browse',
    component: BrowseComponent,
  },
  {
    path: '',
    redirectTo: 'browse',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'browse',
  },
];
