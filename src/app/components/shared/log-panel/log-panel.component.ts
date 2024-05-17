import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface LogPanel{
  title: string
  logs: string[]
  cssClass: string
  titleIcon: string
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
export class LogPanelComponent implements OnInit, OnChanges {

  @Input() errorLogs: string[] = [];
  @Input() successLogs: string[] = [];
  @Input() warningLogs: string[] = [];

  panels: LogPanel[] = [];

  ngOnInit(): void {
    this.syncLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.syncLogs();
  }

  private syncLogs(){
    this.panels = [];

    if(this.successLogs.length > 0){
      this.panels.push({
        title: 'Success',
        logs: this.successLogs,
        cssClass: 'success-bar',
        titleIcon: 'check'
      });
    }

    if(this.warningLogs.length > 0){
      this.panels.push({
        title: 'Warning',
        logs: this.warningLogs,
        cssClass: 'warning-bar',
        titleIcon: 'warning'
      });
    }

    if(this.errorLogs.length > 0){
      this.panels.push({
        title: 'Error',
        logs: this.errorLogs,
        cssClass: 'error-bar',
        titleIcon: 'error'
      });
    }
  }

  dismisPanel(panelTitle: string) {
    this.panels = this.panels.filter(x => x.title != panelTitle);

    switch(panelTitle){
      case 'Success':
        this.successLogs = [];
        break;
      case 'Warning':
        this.warningLogs = [];
        break;
      case 'Error':
        this.errorLogs = [];
        break;
    }
  }
}
