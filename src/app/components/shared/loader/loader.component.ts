import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type loaderType = 'hourglass';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.sass'
})
export class LoaderComponent {

  @Input() loader: loaderType = 'hourglass';

}
