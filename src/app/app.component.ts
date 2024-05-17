import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { HomeComponent } from './components/main/home/home.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DbService } from './services/db/db.service';
import { Subscription, map, switchMap } from 'rxjs';

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
    HomeComponent,
    MatTabsModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit ,OnDestroy{

  navigation: ComponentNavItem[] = [];

  subscriptions: Subscription[] = [];

  constructor(private db: DbService) { }

  ngOnInit(): void {
    let getKeySub = this.db.sync()
      .pipe(
        switchMap((result) => {
          return this.db.getUserSettings;
        }),
        map((dbSetResult) => {
          if(dbSetResult.isLoaded && dbSetResult.data!.eskomSePushApiKey){

            let navItems = [
              { path: 'areas/my', icon: 'home' },
              { path: 'areas/add', icon: 'manage_search' }
            ];

            if(dbSetResult.data?.pagesAllowance){
              navItems.push({ path: 'allowance', icon: 'wallet' });
            }

            if(dbSetResult.data?.pagesSetup){
              navItems.push({ path: 'page_setup', icon: 'key' });
            }

            navItems.push({ path: 'settings', icon: 'settings' });

            this.navigation = navItems;
          }else{
            this.navigation = [
              { path: 'page_setup', icon: 'key' },
              { path: 'settings', icon: 'settings' }
            ];
          }
        })
      ).subscribe();

    this.subscriptions.push(getKeySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
