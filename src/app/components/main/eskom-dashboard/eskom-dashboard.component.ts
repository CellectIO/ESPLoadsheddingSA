import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { TimeSlotChartComponent } from "../../shared/time-slot-chart/time-slot-chart.component";
import { AreaScheduleComponent } from "../../shared/area-schedule/area-schedule.component";
import { LoadSheddingStatusComponent } from "../../shared/load-shedding-status/load-shedding-status.component";
import { UpcommingScheduleComponent } from "../../shared/upcomming-schedule/upcomming-schedule.component";
import { Subscription, map, switchMap } from "rxjs";
import { AreaInfoEntity } from "../../../core/models/entities/area-info-entity";
import { EskomStatusLocation } from "../../../core/models/common/status/eskom-status-location";
import { ActivatedRoute } from "@angular/router";
import { LogPanelService } from "../../../services/log-panel/log-panel.service";
import { CommonModule } from "@angular/common";
import { DbService } from "../../../services/db/db.service";

@Component({
  selector: 'app-eskom-dashboard',
  standalone: true,
  imports: [
    MatIconModule,
    TimeSlotChartComponent,
    AreaScheduleComponent,
    LoadSheddingStatusComponent,
    UpcommingScheduleComponent,
    CommonModule
  ],
  templateUrl: './eskom-dashboard.component.html',
  styleUrl: './eskom-dashboard.component.sass'
})
export class EskomDashboardComponent implements OnInit, OnDestroy {

  areaId: string = '';
  areaInfoDataSet: AreaInfoEntity | null = null;
  loadSheddingStatus: EskomStatusLocation[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private db: DbService,
    private activatedRoute: ActivatedRoute,
    private logPanel: LogPanelService
  ) {

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    let routeSub = this.activatedRoute.paramMap.pipe(
      map((params) => {
        let routeId = params.get('id');
        if(routeId){
          this.areaId = routeId;
          this.loadEskomDataSets();
        }else{
          this.logPanel.setErrorLogs(['no settings have been saved yet.']);
        }
      })
    ).subscribe();

    this.subscriptions.push(routeSub);
  }

  loadEskomDataSets() {
    let loadSub = this.db.getAreaInformation(this.areaId)
      .pipe(
        map((value) => {
          if (value.isSuccess) {
            this.areaInfoDataSet = value.data!;
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        }),
        switchMap((value) => {
          return this.db.getStatus();
        }),
        map((value) => {
          if (value.isSuccess) {
            this.loadSheddingStatus = value.data?.status._all!
          } else {
            this.logPanel.setErrorLogs(value.errors!);
          }
        })
      ).subscribe();

    this.subscriptions.push(loadSub);
  }

}
