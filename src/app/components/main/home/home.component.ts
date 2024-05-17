import { Component, OnInit } from '@angular/core';
import { LogPanelComponent } from '../../shared/log-panel/log-panel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    LogPanelComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass'
})
export class HomeComponent implements OnInit {

  errorLogs: string[] = [];
  successLogs: string[] = [];
  warningLogs: string[] = [];

  ngOnInit(): void {
    this.errorLogs.push("THIS IS A ERROR", "THIS IS A ERROR", "THIS IS A ERROR",);
    this.warningLogs.push("THIS IS A WARNING", "THIS IS A WARNING", "THIS IS A WARNING");
    this.successLogs.push("THIS IS A SUCCESS", "THIS IS A SUCCESS", "THIS IS A SUCCESS");
  }

}
