import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup, FormControl } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SessionStorageService } from '../../../services/storage/session-storage.service';
import { EskomSePushConfig } from '../../../core/models/common/Settings/user-app-settings';
import { MatDividerModule } from '@angular/material/divider';
import { LogPanelComponent } from '../../shared/log-panel/log-panel.component';
import { DbService } from '../../../services/db/db.service';
import { Subscription, map, of, pairwise, switchMap } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CardComponent } from '../../shared/card/card.component';
import { MatIconModule } from '@angular/material/icon';
import { StorageServiceKeyConstants } from '../../../core/constants/storage-service-key.constants';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDividerModule,
    LogPanelComponent,
    MatSlideToggleModule,
    MatIconModule,
    CardComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass'
})
export class SettingsComponent implements OnInit, OnDestroy {

  errorLogs: string[] = [];
  successLogs: string[] = [];
  warningLogs: string[] = [];

  eskomSePushApiForm = new FormGroup({
    apiKey: new FormControl(''),
    syncInterval: new FormControl(15),
    pagesSetup: new FormControl(false),
    pagesAllowance: new FormControl(true),
  });

  subscriptions: Subscription[] = [];

  _initialApiKey: string | null = null;

  constructor(
    private db: DbService,
    private storageService: SessionStorageService
  ) { }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    let keyChangeSub = this.eskomSePushApiForm.controls['apiKey'].valueChanges
      .pipe(pairwise()).subscribe(
        ([prevValue, selectedValue]) => {
          this._initialApiKey = prevValue!;
        }
      );

    let getSub = this.db.getUserSettings
      .pipe(
        map((result) => {
          if (result.isLoaded) {
            this.MapResult(result.data);
          }
        })
      ).subscribe();

    this.subscriptions.push(keyChangeSub);
    this.subscriptions.push(getSub);
  }

  onSubmit() {
    var updatedData = this.MapResult(null);

    //TODO: VALIDATION HERE TO CONFIRM IF THE API KEY IS VALID

    let refreshRequired = (this._initialApiKey != updatedData!.eskomSePushApiKey) && this._initialApiKey != null;

    let saveSub = this.db.updateUserSettings(updatedData!)
      .pipe(
        switchMap(result => {
          if(result && refreshRequired){
            return this.db.init();
          }

          return of(result);
        }),
        map((saveResult) => {
          if (saveResult) {
            this.successLogs = ['EskomSePush Settings have been saved succesfully.'];
          } else {
            this.errorLogs = ['Something went wrong while trying to save settings.'];
          }
        })
      )
      .subscribe();

    this.subscriptions.push(saveSub);
  }

  /**
   * If No Config is provided this function will return current form values, else it will set the form values.
   * @param config 
   * @returns 
   */
  MapResult(config: EskomSePushConfig | null): EskomSePushConfig | null {
    if (config == null) {
      return {
        eskomSePushApiKey: this.eskomSePushApiForm.controls["apiKey"].value!,
        apiSyncInterval: this.eskomSePushApiForm.controls["syncInterval"].value!,
        pagesSetup: this.eskomSePushApiForm.controls["pagesSetup"].value!,
        pagesAllowance: this.eskomSePushApiForm.controls["pagesAllowance"].value!
      }
    }

    this.eskomSePushApiForm.controls["apiKey"].setValue(config.eskomSePushApiKey);
    this.eskomSePushApiForm.controls["syncInterval"].setValue(config.apiSyncInterval);
    this.eskomSePushApiForm.controls["pagesSetup"].setValue(config.pagesSetup);
    this.eskomSePushApiForm.controls["pagesAllowance"].setValue(config.pagesAllowance);

    return null;
  }

  clearCache() {
    //SINCE WE ARE NOT DOING A HARD RESET, WE ONLY DELETE API DATA.
    this.storageService.clear([
      StorageServiceKeyConstants.USER_DATA_SAVED_AREAS,
      StorageServiceKeyConstants.API_RESPONSE_GETSTATUS,
      StorageServiceKeyConstants.API_RESPONSE_GETAREAINFO,
      StorageServiceKeyConstants.API_RESPONSE_GETAREASNEARBY,
      StorageServiceKeyConstants.API_RESPONSE_GETAREA,
      StorageServiceKeyConstants.API_RESPONSE_GETTOPICNEARBY
    ]);

    this.db.reset();

    let syncSub = this.db.init()
      .pipe(
        switchMap(result => {
          return this.db.sync();
        }),
        map(result => {
          if (result) {
            this.successLogs = ['Cache Has been Cleared and Settings Have Succesfully reloaded.'];
          } else {
            this.errorLogs = ['Something went wrong while trying to reload.'];
          }
        })
      ).subscribe();

    this.subscriptions.push(syncSub);
  }

}
