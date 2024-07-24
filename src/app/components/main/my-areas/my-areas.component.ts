import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadSheddingStatusComponent } from '../../shared/load-shedding-status/load-shedding-status.component';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, forkJoin, map } from 'rxjs';
import { AreaSearchEntity } from '../../../core/models/entities/area-search-entity';
import { EskomStatusLocation } from '../../../core/models/common/status/eskom-status-location';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TimeSlotChartComponent } from '../../shared/time-slot-chart/time-slot-chart.component';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../../shared/card/card.component';
import { LogPanelService } from '../../../services/log-panel/log-panel.service';
import { EskomAreaInfoEvent } from '../../../core/models/common/areas/eskom-area-info-event';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { DbService } from '../../../services/db/db.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface MyAreaResult {
  areaId: string;
  areaName: string;
  region: string;
  dayInfo: AreaInfoDayEntity | null;
  events: EskomAreaInfoEvent[]
}

@Component({
  selector: 'app-my-areas',
  standalone: true,
  imports: [
    LoadSheddingStatusComponent,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    TimeSlotChartComponent,
    CardComponent,
    TranslateModule
  ],
  templateUrl: './my-areas.component.html',
  styleUrl: './my-areas.component.sass'
})
export class MyAreasComponent implements OnInit, OnDestroy {

  loadSheddingStatus: EskomStatusLocation[] = [];
  subscriptions: Subscription[] = [];
  savedAreas: MyAreaResult[] = [];

  constructor(
    private db: DbService,
    private router: Router,
    private logPanel: LogPanelService,
    private scheduleService: ScheduleService,
    private translate: TranslateService
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    let statusSub = this.db.getStatus()
      .pipe(
        map(result => {
          if (result.isSuccess) {
            this.loadSheddingStatus = result.data?.status._all!
          } else {
            this.logPanel.setErrorLogs(result.errors!);
          }
        })
      ).subscribe();

    let savedAreasSub = this.db.getSavedOrDefaultAreas()
      .pipe(
        map(result => {
          if (result.isSuccess) {
            this.syncSavedAreasWithAreas(result.data!);
          } else {
            this.logPanel.setErrorLogs(result.errors!);
          }
        })
      ).subscribe();

    this.subscriptions.push(statusSub);
    this.subscriptions.push(savedAreasSub);
  }

  goToManageAreas() {
    this.router.navigate(['areas/add']);
  }

  syncSavedAreasWithAreas(area: AreaSearchEntity) {
    let forkSub = forkJoin(area.areas.map(area => this.db.getAreaInformation(area.id)))
      .subscribe((areaInfos) => {
        areaInfos.forEach(info => {
          if (info.isSuccess) {
            let targetArea = area.areas.filter(_ => _.id == info.data?.areaInfoId)[0];
            let targetAreaInfo = info.data!;
            var localDate = this.scheduleService.localeDateString;
            var currentDateAreaDetails = targetAreaInfo.schedule.days.filter(_ => _.name == localDate);

            this.savedAreas.push({
              areaId: targetArea.id,
              areaName: targetArea.name,
              region: targetArea.region,
              dayInfo: (currentDateAreaDetails.length <= 0) ? null : currentDateAreaDetails[0],
              events: targetAreaInfo.events.length > 0 ? targetAreaInfo.events : []
            });
          }else{
            this.logPanel.setErrorLogs([this.translate.instant('LOGS.FAILED_TO_GET_AREA_INFO')]);
          }
        });
      })

    this.subscriptions.push(forkSub);
  }

  goToAreaInfo(areaId: string) {
    this.router.navigate([`areas/${areaId}`]);
  }

}
