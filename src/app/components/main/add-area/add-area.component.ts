import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, map, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EskomSearchArea } from '../../../core/models/common/areas/eskom-search-area';
import { MatIconModule } from '@angular/material/icon';
import { EskomAreaNearby } from '../../../core/models/common/areas/eskom-area-nearby';
import { CardComponent } from '../../shared/card/card.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { UtilityService } from '../../../services/utility/utility.service';
import { DbService } from '../../../services/db/db.service';
import { LocationService } from '../../../services/location/location.service';
import { ResultBase } from '../../../core/models/response-types/result-base';
import { Result } from '../../../core/models/response-types/result';
import { AreasNearbyEntity } from '../../../core/models/entities/areas-nearby-entity';
import { AreaSearchEntity } from '../../../core/models/entities/area-search-entity';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-area',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CardComponent,
    TranslateModule
  ],
  templateUrl: './add-area.component.html',
  styleUrl: './add-area.component.sass'
})
export class AddAreaComponent implements OnInit, OnDestroy {

  /**
   * Form Control used to enter area name.
   */
  areaNameFormControl: FormControl = new FormControl('');
  /**
   * Subscriptions created throughout the component life cycle
   */
  subscriptions: Subscription[] = [];
  /**
   * Area Search Results that are gathered when a user searches for a area.
   */
  areaSearchResults: EskomSearchArea[] = [];
  /**
   * User saved Areas.
   */
  savedAreas: EskomSearchArea[] = [];
  /**
   * Areas Nearby based on GEO location.
   */
  areasNearbyDataSet: EskomAreaNearby[] = [];
  /**
   * To prevent the user from manipulating results before the previous area action completes.
   * This will Lock the buttons and let the initial action finish first.
   */
  syncingSavedAreas: boolean = false;

  constructor(
    private db: DbService,
    private logPanel: LogPanelService,
    private utility: UtilityService,
    private location: LocationService,
    private translate: TranslateService
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    //DO THE INTIAL CALL FOR THE COMPONENT TO LOAD SAVED ENTTIES.
    let initSub = this.syncSavedAreas()
      .pipe(
        switchMap(() => {
          return this.syncAreasNearby();
        })
      )
      .subscribe();

    //AS SOON AS A SYNC IS EMITTED, RELOAD THE SAVED ENTITIES.
    let syncSub = this.db.sync$
      .pipe(
        switchMap(() => {
          return this.syncSavedAreas();
        })
      ).subscribe();

    this.subscriptions.push(initSub);
    this.subscriptions.push(syncSub);
  }

  getAreaSearchResult(): void {
    let areaNameFormControl = this.areaNameFormControl.value!;
    if (areaNameFormControl == '') {
      this.logPanel.setWarningLogs([this.translate.instant('LOGS.PROVIDE_VALID_AREA')]);
      this.areaSearchResults = [];
      return;
    }

    let syncSub = this.db.searchArea(areaNameFormControl)
      .pipe(
        map((value) => {
          if (value.isSuccess) {
            this.filterOutAreaResults(value.data!, null, null);
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      ).subscribe();

    this.subscriptions.push(syncSub);
  }

  addArea(area: EskomSearchArea) {
    let exsists = this.savedAreas.includes(area);
    if (exsists) {
      this.logPanel.setWarningLogs([this.translate.instant('LOGS.AREA_ALREADY_SAVED')]);
      return
    }

    this._updateSavedAreas(area, 'add');
  }

  removeArea(area: EskomSearchArea) {
    let exsists = this.savedAreas.includes(area);
    if (!exsists) {
      this.logPanel.setWarningLogs([this.translate.instant('LOGS.AREA_IS_NOT_SAVED')]);
      return
    }

    this._updateSavedAreas(area, 'remove');
  }

  private syncSavedAreas() {
    return this.db.getSavedOrDefaultAreas()
      .pipe(
        map((result) => {
          if (result.isSuccess) {
            this.filterOutAreaResults(null, result.data!, null);
          } else {
            this.logPanel.setErrorLogs(result.errors!);
          }
        })
      );
  }

  private syncAreasNearby() {
    return this.location.getCurrentPosition()
      .pipe(
        switchMap(result => {
          if (result.isSuccess) {

            return this.db.getAreasNearby(result.data!.coords.latitude, result.data!.coords.longitude);
          }

          this.logPanel.setErrorLogs([this.translate.instant('LOGS.COULD_NOT_DETERMINE_LOCATION')]);
          return of(new Result<AreasNearbyEntity>(null, result.errors));
        }),
        map((value) => {
          if (value.isSuccess) {
            this.filterOutAreaResults(null, null, value.data!);
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      );
  }

  private _updateSavedAreas(area: EskomSearchArea, state: 'add' | 'remove') {
    this.syncingSavedAreas = true;

    let currentAreas = this.utility.newArray(this.savedAreas);

    if (state == 'add') {
      currentAreas.push(area);
    } else {
      currentAreas = currentAreas.filter(_ => _.id != area.id);
    }

    //CALL THE GET AREA INFO TO CACHE THE INFO FOR OTHER COMPONENTS.
    let saveSub = this.db.getAreaInformation(area.id)
      .pipe(
        switchMap((areaResult) => {
          if (areaResult.isSuccess == false) {
            this.logPanel.setErrorLogs([this.translate.instant('LOGS.FAILED_TO_SAVE_AREA_WITH_NAME', {
              name: area.name
            })]);
            return of(new ResultBase(areaResult.errors));
          }

          //IF THE AREA HAS BEEN RETRIEVED AND CACHED, THEN SAVE THE UPDATED LIST.
          return this.db.updateSavedAreas({
            areas: currentAreas
          });
        }),
        switchMap(result => {
          if (result.isSuccess == false) {
            return of(new Result<AreaSearchEntity>(null, result.errors));
          }

          //SYNC THE LATEST SAVED AREAS
          return this.db.getSavedOrDefaultAreas();
        }),
        map(result => {
          if (result.isSuccess) {
            this.filterOutAreaResults(null, result.data!, null);
            this.logPanel.setSuccessLogs([this.translate.instant('LOGS.SAVED_AREAS_UPDATED')]);
          }

          this.syncingSavedAreas = false;
        })
      ).subscribe();

    this.subscriptions.push(saveSub);
  }

  private filterOutAreaResults(search: AreaSearchEntity | null, saved: AreaSearchEntity | null, nearby: AreasNearbyEntity | null) {
    let excludeAreaIds: string[] = [];
    
    //STEP 1: SYNC SAVED AREAS
    if (saved != null) {
      this.savedAreas = saved.areas;
    }

    this.savedAreas.forEach(area => {
      excludeAreaIds.push(area.id);
    });

    //STEP 2: SYNC AREAS NEARBY
    if (search != null) {
      this.areaSearchResults = search.areas.filter(_ => !excludeAreaIds.includes(_.id));
    }else{
      this.areaSearchResults = this.areaSearchResults.filter(_ => !excludeAreaIds.includes(_.id));
    }

    this.areaSearchResults.forEach(area => {
      excludeAreaIds.push(area.id);
    });

    //STEP 3: SYNC SEARCH AREAS
    if (nearby != null) {
      this.areasNearbyDataSet = nearby.areas.filter(_ => !excludeAreaIds.includes(_.id));
    }else{
      this.areasNearbyDataSet = this.areasNearbyDataSet.filter(_ => !excludeAreaIds.includes(_.id));
    }

  }

}
