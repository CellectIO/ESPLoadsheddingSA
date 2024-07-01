import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { Subscription, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { environment } from '../../../../environments/environment';

interface LogPanel {
  id: string;
  title: string;
  logs: string[];
  cssClass: string;
  titleIcon: string;
  timestamp: number;
}

@Component({
  selector: 'app-log-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './log-panel.component.html',
  styleUrl: './log-panel.component.sass'
})
export class LogPanelComponent implements OnInit, OnDestroy {

  panels: LogPanel[] = [];
  subscriptions: Subscription[] = [];
  interval = setInterval(() => this.syncLogs(), environment.logging.logPanel.syncEverySeconds);

  constructor(private logPanelService: LogPanelService, 
    private scheduleService: ScheduleService) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearInterval(this.interval);
  }

  ngOnInit(): void {
    let successSub = this.logPanelService.successLogs
      .pipe(
        tap(logs => {
          if (logs.length > 0) {
            this.panels.push({
              id: uuidv4(),
              title: 'Success',
              logs: logs,
              cssClass: 'success-bar',
              titleIcon: 'check',
              timestamp: this.scheduleService.now
            });
          }
        })
      ).subscribe();

    let warningSub = this.logPanelService.warningLogs
      .pipe(
        tap(logs => {
          if (logs.length > 0) {
            this.panels.push({
              id: uuidv4(),
              title: 'Warning',
              logs: logs,
              cssClass: 'warning-bar',
              titleIcon: 'warning',
              timestamp: this.scheduleService.now
            });
          }
        })
      ).subscribe();

    let errorSub = this.logPanelService.errorLogs
      .pipe(
        tap(logs => {
          if (logs.length > 0) {
            this.panels.push({
              id: uuidv4(),
              title: 'Error',
              logs: logs,
              cssClass: 'error-bar',
              titleIcon: 'error',
              timestamp: this.scheduleService.now
            });
          }
        })
      ).subscribe();

    this.subscriptions.push(successSub);
    this.subscriptions.push(warningSub);
    this.subscriptions.push(errorSub);
  }

  dismisPanel(id: string) {
    this.panels = this.panels.filter(x => x.id != id);
  }

  syncLogs() {
    const now = this.scheduleService.now;
    this.panels = this.panels.filter(item => now - item.timestamp < environment.logging.logPanel.logLifeSpanSeconds);
  }

}
