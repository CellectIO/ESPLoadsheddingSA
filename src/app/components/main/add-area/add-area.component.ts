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

  areasNearbyDataSet: EskomAreaNearby[] = [];
  areaSearchDataSet: EskomSearchArea[] = [];
  savedAreas: EskomSearchArea[] = [];
  subscriptions: Subscription[] = [];

  areaName: FormControl = new FormControl('');

  constructor(
    private db: DbService,
    private logPanel: LogPanelService
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
        })
      ).subscribe();

    this.subscriptions.push(getSub);
  }

  getAreaSearchResult(): void {
    let areaName = this.areaName.value!;
    if (areaName == '') {
      this.logPanel.setWarningLogs(['Please Provide a Valid Area Name']);
      this.areaSearchDataSet = [];
      return
    }

    let syncSub = this.db.addArea(areaName, true)
      .pipe(
        switchMap((result) => {
          return this.db.getArea;
        }),
        map((value) => {
          if (value.isLoaded) {
            let savedAreas = this.savedAreas.map(_ => _.id);
            let unSavedAreas = value.data![0].areas.filter(_ => !savedAreas.includes(_.id)); //TODO: don't always use the first result
            this.areaSearchDataSet = unSavedAreas;
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      ).subscribe();

    this.subscriptions.push(syncSub);
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
    //ONLY SAVE IF AREA IS NOT SAVED ALREADY
    let exsists = this.savedAreas.includes(area);
    if (exsists) {
      this.logPanel.setWarningLogs(['Area is already saved.']);
      return
    }

    this.savedAreas.push(area);
    this._updateSavedAreas();
  }

  removeArea(area: EskomSearchArea) {
    //ONLY REMOVE IF AREA IS ALREADY SAVED
    let exsists = this.savedAreas.includes(area);
    if (!exsists) {
      this.logPanel.setWarningLogs(['Area Does not exists in saved Areas.']);
      return
    }

    this.savedAreas = this.savedAreas.filter(_ => _ != area);
    this._updateSavedAreas();
  }

  private _updateSavedAreas() {
    let updateSub = this.db.updateSavedAreas({
      areas: this.savedAreas
    }).pipe(
      map((saveResult) => {
        if (saveResult) {
          let savedAreas = this.savedAreas.map(_ => _.id);
          this.areaSearchDataSet = this.areaSearchDataSet.filter(_ => !savedAreas.includes(_.id));
          this.areasNearbyDataSet = this.areasNearbyDataSet.filter(_ => !savedAreas.includes(_.id));
        }

        return saveResult;
      }),
      switchMap((saveResult) => {
        if (saveResult) {
          this._setAreaInfoForSavedAreas();
        }

        return of(true);
      })
    ).subscribe();

    this.subscriptions.push(updateSub);
  }

  private _setAreaInfoForSavedAreas() {
    let getSub = this.db.getAreasInformation
      .pipe(
        map((savedAreaInfoResult) => {
          if (savedAreaInfoResult.isLoaded) {

            let newAreas = this.savedAreas.filter(_ => !savedAreaInfoResult.data.map(_ => _.areaInfoId).includes(_.id));

            newAreas.forEach(area => {
              let addSub = this.db.addAreaInformation(area.id, true)
                .pipe(
                  map((saveResult) => {
                    if (!saveResult) {
                      this.logPanel.setErrorLogs([`failed to save area with name: ${area.name}`]);
                    }else{
                      this.logPanel.setSuccessLogs(['Saved Areas have been updated.']);
                    }
                  })
                )
                .subscribe();

              this.subscriptions.push(addSub);
            });

          }
        })
      ).subscribe();

    this.subscriptions.push(getSub);
  }

}
