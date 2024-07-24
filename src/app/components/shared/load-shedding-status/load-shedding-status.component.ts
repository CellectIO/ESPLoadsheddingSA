import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { EskomStatusLocation } from '../../../core/models/common/status/eskom-status-location';
import { CardComponent } from '../card/card.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-load-shedding-status',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CardComponent,
    TranslateModule
  ],
  templateUrl: './load-shedding-status.component.html',
  styleUrl: './load-shedding-status.component.sass'
})
export class LoadSheddingStatusComponent {

  @Input() loadSheddingStatus: EskomStatusLocation[] = [];

  constructor(public ngStyleService: NgStyleService,) {
    
  }

}
