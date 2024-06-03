import { Component, OnDestroy, OnInit } from '@angular/core';
import { DbService } from '../../../services/db/db.service';
import { Observable, Subscription, map, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EskomSearchArea } from '../../../core/models/common/areas/eskom-search-area';
import { MatIconModule } from '@angular/material/icon';
import { EskomAreaNearby } from '../../../core/models/common/areas/eskom-area-nearby';
import { CardComponent } from '../../shared/card/card.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { UtilityService } from '../../../services/utility/utility.service';

@Component({
  selector: 'app-add-area',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CardComponent
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
   * Saved Area Entities for Saved Areas.
   */
  savedAreaInfoEntities: AreaInfoEntity[] = [];
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
    private utility: UtilityService
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.getDbResults();
  }

  getDbResults(): void {
    let getSub = this.getSavedAreasDbResult()
      .pipe(
        switchMap((result) => {
          return this.getAreasNearbyDbResult();
        }),
        switchMap((result) => {
          return this.getSavedAreaInformation();
        })
      ).subscribe();

    this.subscriptions.push(getSub);
  }

  getAreaSearchResult(): void {
    let areaNameFormControl = this.areaNameFormControl.value!;
    if (areaNameFormControl == '') {
      this.logPanel.setWarningLogs(['Please Provide a Valid Area Name']);
      this.areaSearchResults = [];
      return
    }

    let syncSub = this.db.addArea(areaNameFormControl, true)
      .pipe(
        switchMap((result) => {
          return this.db.getArea;
        }),
        map((value) => {
          if (value.isLoaded) {
            let savedAreas = this.savedAreas.map(_ => _.id);
            let unSavedAreas = value.data![0].areas.filter(_ => !savedAreas.includes(_.id)); //TODO: don't always use the first result
            this.areaSearchResults = unSavedAreas;
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      ).subscribe();

    this.subscriptions.push(syncSub);
  }

  getSavedAreaInformation(): Observable<void> {
    return this.db.getAreasInformation
      .pipe(
        map((result) => {
          if (result.isLoaded) {
            this.savedAreaInfoEntities = result.data!;
          } else {
            this.logPanel.setErrorLogs(result.errors!);
          }
        })
      );
  }

  getSavedAreasDbResult(): Observable<void> {
    return this.db.getSavedAreas
      .pipe(
        map((result) => {
          if (result.isLoaded) {
            this.savedAreas = result.data!.areas;
          } else {
            this.logPanel.setErrorLogs(result.errors!);
          }
        })
      );
  }

  getAreasNearbyDbResult(): Observable<void> {
    return this.db.getAreasNearby
      .pipe(
        map((value) => {
          if (value.isLoaded) {
            let savedAreas = this.savedAreas.map(_ => _.id);
            let unSavedAreas = value.data!.areas.filter(_ => !savedAreas.includes(_.id));
            this.areasNearbyDataSet = unSavedAreas;
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      );
  }

  addArea(area: EskomSearchArea) {
    let exsists = this.savedAreas.includes(area);
    if (exsists) {
      this.logPanel.setWarningLogs(['Area is already saved.']);
      return
    }

    this._updateSavedAreas(area, 'add');
  }

  removeArea(area: EskomSearchArea) {
    let exsists = this.savedAreas.includes(area);
    if (!exsists) {
      this.logPanel.setWarningLogs(['Area Does not exists in saved Areas.']);
      return
    }

    this._updateSavedAreas(area, 'remove');
  }

  private _updateSavedAreas(area: EskomSearchArea, state: 'add' | 'remove') {
    this.syncingSavedAreas = true;

    let currentAreas = this.utility.newArray(this.savedAreas);
    let currentAreaInfos = this.utility.newArray(this.savedAreaInfoEntities);

    if(state == 'add'){
      currentAreas.push(area);
    }else{
      currentAreas = currentAreas.filter(_ => _.id != area.id);
    }

    let isNewAreaInfo = !currentAreaInfos.map(_ => _.areaInfoId).includes(area.id);

    let updateSub = of(true)
      .pipe(
        switchMap(() => {
          if(isNewAreaInfo){
            return this.db.addAreaInformation(area.id, true)
              .pipe(
                map((saveResult) => {
                  if (!saveResult) {
                    this.logPanel.setErrorLogs([`failed to save area with name: ${area.name}`]);
                  }

                  return saveResult;
                })
              );
          }
          return of(true);
        }),
        switchMap((areaSaved) => {
          if(areaSaved){
            return this.db.updateSavedAreas({
              areas: currentAreas
            });
          }

          return of(areaSaved);
        }),
        map(result => {
          if(result){
            let savedAreas = currentAreas.map(_ => _.id);

            this.savedAreas = currentAreas;
            this.areaSearchResults = this.areaSearchResults.filter(_ => !savedAreas.includes(_.id));
            this.areasNearbyDataSet = this.areasNearbyDataSet.filter(_ => !savedAreas.includes(_.id));
            this.logPanel.setSuccessLogs(['Saved Areas have been updated.']);
          }

          this.syncingSavedAreas = false;
        })
      ).subscribe();

    this.subscriptions.push(updateSub);
  }

}
