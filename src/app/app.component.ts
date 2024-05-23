import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DbService } from './services/db/db.service';
import { Subscription, exhaustMap, of, switchMap } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { LogPanelComponent } from './components/shared/log-panel/log-panel.component';

export interface ComponentNavItem{
  path: string
  icon: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatTabsModule,
    RouterModule,
    MatIconModule,
    LogPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit ,OnDestroy{

  navigation: ComponentNavItem[] = [];

  subscriptions: Subscription[] = [];

  constructor(private db: DbService, private logger: NGXLogger) { }

  ngOnInit(): void {
    //SYNC SETTINGS FIRST TO CONFIRM IF ITS A FIRST TIME USER, THEN DETERMINE IF A FULL SYNC SHOULD RUN.
    let getKeySub = this.db.sync()
      .pipe(
        switchMap(result => {
          return this.db.getUserSettings;
        }),
        exhaustMap(result => {
          if(result.isLoaded == false || result.data?.eskomSePushApiKey == null || result.data?.eskomSePushApiKey == ''){
            this.logger.warn('Eskom Se Push API Key has not been saved yet. Loading Initial Setup Pages.');

            this.navigation = [
              { path: 'page_setup', icon: 'key' },
              { path: 'settings', icon: 'settings' }
            ];

            return of(false);
          }else{
            this.logger.info('Eskom Se Push API Key has been saved. Loading Default Pages based on user settings.');

            let navItems = [
              { path: 'areas/my', icon: 'home' },
              { path: 'areas/add', icon: 'manage_search' }
            ];

            if(result.data?.pagesAllowance){
              navItems.push({ path: 'allowance', icon: 'wallet' });
            }

            if(result.data?.pagesSetup){
              navItems.push({ path: 'page_setup', icon: 'key' });
            }

            navItems.push({ path: 'settings', icon: 'settings' });

            this.navigation = navItems;

            return of(true);
          }
        }),
      ).subscribe();

    this.subscriptions.push(getKeySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
