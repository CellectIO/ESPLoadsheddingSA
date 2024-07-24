import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, map, of, switchMap, take, tap } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { LogPanelComponent } from './components/shared/log-panel/log-panel.component';
import { LoaderComponent } from './components/shared/loader/loader.component';
import { LoaderService } from './services/loader/loader.service';
import { EskomSePushConfig } from './core/models/common/Settings/user-app-settings';
import { DbService } from './services/db/db.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ComponentNavItem {
  path: string
  icon: string
  tooltip: string
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
    LoaderComponent,
    LogPanelComponent,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit, OnDestroy {

  navigation: ComponentNavItem[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private db: DbService,
    private logger: NGXLogger,
    public loader: LoaderService,
    public router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    // IMPORTANT:
    // The application might try to get a translations while the translation service
    // might not have succesfully loaded yet, So listening on the translation service to determine
    // when pages can load.
    let translationSub = this.translate.store.onDefaultLangChange
      .pipe(
        take(1),
        tap(() => {
          this.logger.info(this.translate.instant('LOGS.TRANSLATIONS_HAVE_LOADED'));
          this._init();
        })
      ).subscribe();
    
    this.subscriptions.push(translationSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private _init(): void {
    //DO THE INITIAL CALL TO DETERMINE THE TABS THAT SHOULD BE RENDERED
    let initSub = this._syncTabs().subscribe();

    //LISTEN FOR SYNC EVENTS TO UPDATE THE TAB IF THE USER MAYBE UPDATED SETTINGS
    let syncSub = this.db.sync$.pipe(
      switchMap(() => {
        this.logger.info(this.translate.instant('LOGS.DB_SYNC_COMPLETED'));
        return this._syncTabs();
      })
    ).subscribe();

    this.subscriptions.push(initSub);
    this.subscriptions.push(syncSub);
  }

  private _syncTabs(): Observable<Observable<boolean>> {
      return this.db.getSavedOrDefaultUserSettings()
        .pipe(
          map(result => {
            let isRegistered = this.db.isRegistered();
            if (result.isSuccess == false || isRegistered.isSuccess == false) {
              return this._loadSetupPages();
            } else {
              return this._loadUserPages(result.data!);
            }
          })
        );
  }

  private _loadUserPages(config: EskomSePushConfig): Observable<boolean> {
    this.logger.info(this.translate.instant('LOGS.SETTINGS_SAVED_LOADING_DEFAULT'));

    let navItems: ComponentNavItem[] = [
      { path: 'areas/my', icon: 'home', tooltip: 'PAGES.APP.INFO.HOME' },
      { path: 'areas/add', icon: 'manage_search', tooltip: 'PAGES.APP.INFO.MANAGE_AREAS' }
    ];

    if (config.pagesAllowance) {
      navItems.push({ path: 'allowance', icon: 'wallet', tooltip: 'PAGES.APP.INFO.ALLOWANCE' });
    }

    if (config.pagesSetup) {
      navItems.push({ path: 'page_setup', icon: 'key', tooltip: 'PAGES.APP.INFO.SETUP' });
    }

    navItems.push({ path: 'settings', icon: 'settings', tooltip: 'PAGES.APP.INFO.SETTINGS' });

    this.navigation = navItems;

    return of(true);
  }

  private _loadSetupPages(): Observable<boolean> {
    this.logger.info(this.translate.instant('LOGS.SETTINGS_NOT_SAVED_LOADING_INIT'));

    this.navigation = [
      { path: 'page_setup', icon: 'key', tooltip: 'PAGES.APP.INFO.SETUP' },
      { path: 'settings', icon: 'settings', tooltip: 'PAGES.APP.INFO.SETTINGS' }
    ];

    //IF YOU ARE LOADING THE SETUP PAGES MAKE THE SETUP PAGE THE LANDING SITE
    this.router.navigate(['page_setup']);

    return of(false);
  }

}
