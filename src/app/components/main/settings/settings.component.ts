import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SessionStorageService } from '../../../services/storage/session-storage.service';
import { EskomSePushConfig } from '../../../core/models/common/Settings/user-app-settings';
import { Observable, Subscription, map, of, pairwise, switchMap } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CardComponent } from '../../shared/card/card.component';
import { MatIconModule } from '@angular/material/icon';
import { StorageServiceKeyConstants } from '../../../core/constants/storage-service-key.constants';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { CommonModule } from '@angular/common';
import { DbService } from '../../../services/db/db.service';
import { ResultBase } from '../../../core/models/response-types/result-base';
import { LocationService } from '../../../services/location/location.service';
import { Result } from '../../../core/models/response-types/result';
import { AreasNearbyEntity } from '../../../core/models/entities/areas-nearby-entity';
import { LoaderService } from '../../../services/loader/loader.service';
import { environment } from '../../../../environments/environment';
import { InfoIconComponent } from '../../shared/info-icon/info-icon.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    CardComponent,
    InfoIconComponent,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.sass'
})
export class SettingsComponent implements OnInit, OnDestroy {

  isRegistered: boolean = false;

  eskomSePushApiForm = new FormGroup({
    apiKey: new FormControl(''),
    syncInterval: new FormControl(environment.cache.defaultExpiresInMinutes),
    pagesSetup: new FormControl(false),
    pagesAllowance: new FormControl(true),
  });

  subscriptions: Subscription[] = [];
  _initialApiKey: string | null = null;

  constructor(
    private db: DbService,
    private storageService: SessionStorageService,
    private logPanel: LogPanelService,
    private location: LocationService,
    private loader: LoaderService,
    private translate: TranslateService
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

    let getSub = this.db.getSavedOrDefaultUserSettings()
      .pipe(
        map((result) => {
          if (result.isSuccess) {
            this.MapResult(result.data);
          }
        })
      ).subscribe();

    let isRegSub = this.db.sync$
      .pipe(
        map(result => {
          let isRegResult = this.db.isRegistered();
          this.isRegistered = isRegResult.isSuccess;
        })
      ).subscribe();

    this.subscriptions.push(keyChangeSub);
    this.subscriptions.push(getSub);
    this.subscriptions.push(isRegSub);
  }

  onSubmit() {
    var updatedData = this.MapResult(null);

    if (!updatedData!.eskomSePushApiKey && !(this._initialApiKey)) {
      this.logPanel.setWarningLogs([this.translate.instant('LOGS.PROVIDE_A_VALID_ESP_API_KEY')]);
      return;
    }

    let refreshRequired = (this._initialApiKey != updatedData!.eskomSePushApiKey);

    const logFunc = (result: ResultBase) => {
      if (result.isSuccess) {
        this.logPanel.setSuccessLogs([this.translate.instant('LOGS.SETTINGS_SAVED_SUCCESFULLY')]);
      } else {
        this.logPanel.setErrorLogs([this.translate.instant('LOGS.SETTINGS_SAVED_UNSUCCESFULLY')]);
      }
    }

    let saveSub: Subscription;
    if (refreshRequired) {
      saveSub = this.updateUserSettingsAndInitializeData(updatedData!)
        .pipe(
          map(result => {
            logFunc(result);
          })).subscribe();
    } else {
      saveSub = this.updateUserSettings(updatedData!)
        .pipe(
          map(result => {
            logFunc(result);
          })).subscribe();
    }

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

    this._initialApiKey = config.eskomSePushApiKey;

    return null;
  }

  clearCache(logResult: boolean = false) {
    this.storageService.clear([
      StorageServiceKeyConstants.USER_DATA_SAVED_AREAS,
      StorageServiceKeyConstants.API_RESPONSE_GETSTATUS,
      StorageServiceKeyConstants.API_RESPONSE_GETAREAINFO,
      StorageServiceKeyConstants.API_RESPONSE_GETAREASNEARBY,
      StorageServiceKeyConstants.API_RESPONSE_GETAREA
    ]);

    if(logResult){
      this.logPanel.setSuccessLogs([this.translate.instant('LOGS.CACHE_CLEARED_SUCCESFULLY')]);
    }
  }

  updateUserSettings(config: EskomSePushConfig): Observable<ResultBase> {
    return this.db.updateUserSettings(config)
      .pipe(
        map(updateResult => {
          if (updateResult.isSuccess == false) {
            return updateResult;
          }

          this.db._invokeSync();

          return new ResultBase(null);
        })
      )
  }

  updateUserSettingsAndInitializeData(config: EskomSePushConfig): Observable<ResultBase> {
    this.loader.setAppLoading(true);
    return this.db.validateApiKey(config.eskomSePushApiKey!)
      .pipe(
        switchMap(result => {
          if (!result.isSuccess) {
            return of(result);
          }

          return this.db.updateUserSettings(config);
        }),
        switchMap(result => {
          if (!result.isSuccess) {
            return of(result);
          }

          //INITIALIZE THE ALLOWANCE CACHE
          return this.db.getLatestOrDefaultAllowance()
            .pipe(
              map(result => {
                return result.isSuccess ? new ResultBase(null) : new ResultBase(result.errors);
              })
            );
        }),
        switchMap(result => {
          if (!result.isSuccess) {
            return of(result);
          }

          this.clearCache();

          return this.db.getStatus()
            .pipe(
              map(result => {
                return result.isSuccess ? new ResultBase(null) : new ResultBase(result.errors);
              })
            );
        }),
        switchMap(result => {
          if (result.isSuccess == false) {
            return of(result);
          }

          return this.location.getCurrentPosition()
            .pipe(
              switchMap(result => {
                if (result.isSuccess) {
                  return this.db.getAreasNearby(result.data!.coords.latitude, result.data!.coords.longitude);
                }

                return of(new Result<AreasNearbyEntity>(null, result.errors));
              }),
              map(result => {
                return result.isSuccess ? new ResultBase(null) : new ResultBase(result.errors);
              })
            );
        }),
        map(result => {
          if (result.isSuccess) {
            this.db._invokeSync();
          }

          this.loader.setAppLoading(false);
          return result;
        })
      )
  }

}
