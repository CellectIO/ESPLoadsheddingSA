import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.sass'
})
export class CardComponent {

  @Input() cssClass: string = 'eskom-bg-color';

}
