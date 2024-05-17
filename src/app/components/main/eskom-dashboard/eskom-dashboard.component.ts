import { Component, OnDestroy, OnInit } from "@angular/core";
import { LogPanelComponent } from "../../shared/log-panel/log-panel.component";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { TimeSlotChartComponent } from "../../shared/time-slot-chart/time-slot-chart.component";
import { AreaScheduleComponent } from "../../shared/area-schedule/area-schedule.component";
import { LoadSheddingStatusComponent } from "../../shared/load-shedding-status/load-shedding-status.component";
import { SetupComponent } from "../../shared/setup/setup.component";
import { UpcommingScheduleComponent } from "../../shared/upcomming-schedule/upcomming-schedule.component";
import { DbService } from "../../../services/db/db.service";
import { SessionStorageService } from "../../../services/storage/session-storage.service";
import { NGXLogger } from "ngx-logger";
import { Subscription, map, switchMap } from "rxjs";
import { AreaInfoEntity } from "../../../core/models/entities/area-info-entity";
import { EskomStatusLocation } from "../../../core/models/common/status/eskom-status-location";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-eskom-dashboard',
  standalone: true,
  imports: [
    LogPanelComponent,
    CommonModule,
    MatIconModule,
    TimeSlotChartComponent,
    AreaScheduleComponent,
    LoadSheddingStatusComponent,
    SetupComponent,
    UpcommingScheduleComponent
  ],
  templateUrl: './eskom-dashboard.component.html',
  styleUrl: './eskom-dashboard.component.sass'
})
export class EskomDashboardComponent implements OnInit, OnDestroy {

  errorLogs: string[] = [];
  successLogs: string[] = [];
  warningLogs: string[] = [];

  areaId: string = '';

  areaInfoDataSet: AreaInfoEntity | null = null;
  loadSheddingStatus: EskomStatusLocation[] = [];

  subscriptions: Subscription[] = [];

  constructor(
    private db: DbService,
    private storageService: SessionStorageService,
    private logger: NGXLogger,
    private activatedRoute: ActivatedRoute
  ) {

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.useEskomComponent();
  }

  useEskomComponent() {
    let routeSub = this.activatedRoute.paramMap.pipe(
      map((params) => {
        let routeId = params.get('id');
        if(routeId){
          this.areaId = routeId;
          this.loadEskomDataSets();
        }else{
          this.errorLogs.push('no settings have been saved yet.');
        }
      })
    ).subscribe();

    this.subscriptions.push(routeSub);
  }

  loadEskomDataSets() {
    let loadSub = this.db.getAreasInformation
      .pipe(
        map((value) => {
          if (value.isLoaded) {
            let targetArea = value.data.filter(_ => _.areaInfoId == this.areaId);
            if(targetArea.length > 0){
              this.areaInfoDataSet = targetArea[0];
            }else{
              this.errorLogs = ['Area Information has not been loaded for this target area.']
            }
          } else {
            this.errorLogs = value.errors!;
          }
        }),
        switchMap((value) => {
          return this.db.getStatus;
        }),
        map((value) => {
          if (value.isLoaded) {
            this.loadSheddingStatus = value.data?.status._all!
          } else {
            this.errorLogs = value.errors!;
          }
        })
      ).subscribe();

    this.subscriptions.push(loadSub);
  }

}
