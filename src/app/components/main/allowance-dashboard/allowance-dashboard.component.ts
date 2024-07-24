import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { AllowanceEntity } from '../../../core/models/entities/allowance-entity';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { CardComponent } from '../../shared/card/card.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { DbService } from '../../../services/db/db.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-allowance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CardComponent,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './allowance-dashboard.component.html',
  styleUrl: './allowance-dashboard.component.sass'
})
export class AllowanceDashboardComponent implements OnInit, OnDestroy {

  allowance: AllowanceEntity | null = null;
  subscriptions: Subscription[] = [];

  constructor(
    private db: DbService,
    public ngStyleService: NgStyleService,
    private logPanel: LogPanelService,
    private translate: TranslateService
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    let getSub = this.db.getLatestOrDefaultAllowance()
      .pipe(
        map(result => {
          if (result.isSuccess) {
            this.allowance = result.data;
          } else {
            this.logPanel.setErrorLogs([this.translate.instant('LOGS.FAILED_TO_SYNC_ALLOWANCE')]);
          }
        })
      ).subscribe();

    this.subscriptions.push(getSub);
  }

}
