import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { InfoIconComponent } from '../info-icon/info-icon.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import {CardComponent} from "../card/card.component";

@Component({
  selector: 'app-setup',
  standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        TranslateModule,
        InfoIconComponent,
        CardComponent
    ],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.sass'
})
export class SetupComponent {

  gumroadLink: string = environment.sign_up_link;

  constructor(
    private logPanel: LogPanelService,
    private translate: TranslateService
  ) {

  }

  copyText() {
    const inputElement = document.createElement('input');
    inputElement.value = this.gumroadLink;
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);

    this.logPanel.setSuccessLogs([this.translate.instant('LOGS.LINK_COPIED')]);
  }

}
