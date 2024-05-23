import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { Subscription, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

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

  syncEvery: number = 2000;
  logStayAlive: number = 4000;

  panels: LogPanel[] = [];
  subscriptions: Subscription[] = [];
  interval = setInterval(() => this.syncLogs(), this.syncEvery);

  constructor(private logPanelService: LogPanelService) {
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
              timestamp: Date.now()
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
              timestamp: Date.now()
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
              timestamp: Date.now()
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
    const now = Date.now();
    this.panels = this.panels.filter(item => now - item.timestamp < this.logStayAlive);
  }

}
