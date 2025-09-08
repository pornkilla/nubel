import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HomeComponent } from './home/home.component';
import { ColormatchComponent } from './colormatch/colormatch.component';
import { FlexroubleComponent } from './flexrouble/flexrouble.component';
import { WorksComponent } from './works/works.component';
import { CreditsComponent } from './credits/credits.component';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter([
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'colormatch', component: ColormatchComponent },
      { path: 'flexrouble', component: FlexroubleComponent },
      { path: 'works', component: WorksComponent },
      { path: 'credits', component: CreditsComponent },
      { path: '**', redirectTo: '/home' }
    ])]
};
