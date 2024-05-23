import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadSheddingStatusComponent } from '../../shared/load-shedding-status/load-shedding-status.component';
import { MatIconModule } from '@angular/material/icon';
import { DbService } from '../../../services/db/db.service';
import { Subscription, map, switchMap } from 'rxjs';
import { AreaSearchEntity } from '../../../core/models/entities/area-search-entity';
import { EskomStatusLocation } from '../../../core/models/common/status/eskom-status-location';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TimeSlotChartComponent } from '../../shared/time-slot-chart/time-slot-chart.component';
import { AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../../shared/card/card.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';

@Component({
  selector: 'app-my-areas',
  standalone: true,
  imports: [
    LoadSheddingStatusComponent,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    TimeSlotChartComponent,
    CardComponent
  ],
  templateUrl: './my-areas.component.html',
  styleUrl: './my-areas.component.sass'
})
export class MyAreasComponent implements OnInit, OnDestroy {

  loadSheddingStatus: EskomStatusLocation[] = [];
  savedAreas: AreaSearchEntity | null = null;
  savedAreasInfo: AreaInfoEntity[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private db: DbService, 
    private router: Router,
    private logPanel: LogPanelService
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.syncComponentData();
  }

  goToManageAreas(){
    this.router.navigate(['areas/add']);
  }

  syncComponentData(){
    let syncSub = this.db.getStatus
    .pipe(
      map((value) => {
        if (value.isLoaded) {
          this.loadSheddingStatus = value.data?.status._all!
        } else {
          this.logPanel.setErrorLogs(value.errors!);
        }
      }),
      switchMap((response) => {
        return this.db.getSavedAreas;
      }),
      map((value) => {
        if (value.isLoaded) {
          this.savedAreas = value.data;
        } else {
          this.logPanel.setErrorLogs(value.errors!);
        }
      }),
      switchMap(() => {
        return this.db.getAreasInformation;
      }),
      map((areaResult) => {
        if(areaResult.isLoaded){
          this.savedAreasInfo = areaResult.data;
        }
      })
    ).subscribe();

    this.subscriptions.push(syncSub);
  }

  getAreaInfo(areaId: string){
    var targetArea = this.savedAreasInfo.filter(_ => _.areaInfoId == areaId);
    return targetArea.length > 0 ? targetArea[0].schedule.days[0] : null;
  }

  goToAreaInfo(areaId: string){
    this.router.navigate([`areas/${areaId}`]);
  }

}
