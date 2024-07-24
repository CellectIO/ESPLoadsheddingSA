import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-info-icon',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './info-icon.component.html',
  styleUrl: './info-icon.component.sass'
})
export class InfoIconComponent {

  @Input() text: string = '';
  @Input() icon: string = '';

  constructor() {
  }

}
