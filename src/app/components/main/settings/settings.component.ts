import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SessionStorageService } from '../../../services/storage/session-storage.service';
import { EskomSePushConfig } from '../../../core/models/common/Settings/user-app-settings';
import { DbService } from '../../../services/db/db.service';
import { Observable, Subscription, map, of, pairwise, switchMap, tap } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CardComponent } from '../../shared/card/card.component';
import { MatIconModule } from '@angular/material/icon';
import { StorageServiceKeyConstants } from '../../../core/constants/storage-service-key.constants';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { CommonModule } from '@angular/common';
import { Result } from '../../../core/models/response-types/result';
import { EskomSePushApiService } from '../../../services/http/eskom-se-push-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatIconModule,
    CardComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass'
})
export class SettingsComponent implements OnInit, OnDestroy {

  eskomSePushApiForm = new FormGroup({
    apiKey: new FormControl(''),
    syncInterval: new FormControl({
      value: 15,
      disabled: true
    }),
    pagesSetup: new FormControl(false),
    pagesAllowance: new FormControl(true),
  });

  subscriptions: Subscription[] = [];
  _initialApiKey: string | null = null;

  constructor(
    private db: DbService,
    private storageService: SessionStorageService,
    private logPanel: LogPanelService,
    private apiService: EskomSePushApiService
  ) { 
  }

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

    if(!updatedData!.eskomSePushApiKey && !this._initialApiKey){
      this.logPanel.setWarningLogs(['Please provide a valid Eskom Se Push API Key']);
      return;
    }

    let saveSub = this.apiService.validateApiKey(updatedData!.eskomSePushApiKey)
      .pipe(
        switchMap(result => {
          if(!result.isSuccess){
            this.logPanel.setErrorLogs([result.data?.error!]);
          }else{
            return this._updateSettings(updatedData!);
          }
          return of(true);
        })
      )
      .subscribe();

    this.subscriptions.push(saveSub);
  }

  _updateSettings(updatedData: EskomSePushConfig){
    let refreshRequired = (this._initialApiKey != updatedData!.eskomSePushApiKey) && this._initialApiKey != null;
    let errorMsg = 'Something went wrong while trying to save settings.';

    return this.db.updateUserSettings(updatedData)
    .pipe(
      switchMap(result => {
        if(result && refreshRequired){
          return this.initApp(
            'EskomSePush Settings have been saved succesfully.',
            errorMsg
          );
        }

        if(result){
          return this.db.sync();
        }

        return of(result);
      }),
      tap(result => {
        if(typeof result == 'boolean' && result == false){
          this.logPanel.setErrorLogs([errorMsg])
        }else if((result as Result<string>).isSuccess == false){
          this.logPanel.setErrorLogs([errorMsg])
        }
      })
    )
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
    let syncSub = this.initApp(
      'Cache Has been Cleared and Settings Have Succesfully reloaded.',
      'Something went wrong while trying to reload.'
    ).subscribe();

    this.subscriptions.push(syncSub);
  }

  initApp(succesLog: string, errorLog: string): Observable<boolean> {
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

    return this.db.init()
      .pipe(
        switchMap(result => {
          if(result){
            return this.db.sync();
          }

          return of(result);
        }),
        map(result => {
          if (result) {
            this.logPanel.setSuccessLogs([succesLog]);
            return true;
          } else {
            this.logPanel.setErrorLogs([errorLog]);
            return false
          }
        })
      );
  }

}
