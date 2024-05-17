import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TimeSlotChartComponent } from '../time-slot-chart/time-slot-chart.component';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { CommonModule } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { EskomAreaInfoStage } from '../../../core/models/common/areas/eskom-area-info-stage';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { EskomStatusLocation } from '../../../core/models/common/status/eskom-status-location';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-upcomming-schedule',
  standalone: true,
  imports: [
    TimeSlotChartComponent,
    CommonModule,
    CardComponent
  ],
  templateUrl: './upcomming-schedule.component.html',
  styleUrl: './upcomming-schedule.component.sass'
})
export class UpcommingScheduleComponent implements OnInit, OnChanges {

  @Input() areaSchedulesUpcomming: AreaInfoDayEntity[] = [];
  @Input() loadSheddingStatus: EskomStatusLocation[] = [];
  @Input() areaInfoDataSet: AreaInfoEntity | null = null;

  constructor(
    public ngStyleService: NgStyleService,
    private logger: NGXLogger
  ) {
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.areaInfoDataSet){
      this.syncUpComming();
    }
  }

  ngOnInit(): void {
    if(this.areaInfoDataSet){
      this.syncUpComming();
    }
  }

  syncUpComming() {
    let currentUserDate = new Date();

    //TODO: we are relying on the EKSOM status for.
    // "next_stages": [
    //   {
    //       "stage": "1",
    //       "stage_start_timestamp": "2022-08-08T17:00:00+02:00"
    //   },
    //   {
    //       "stage": "0",
    //       "stage_start_timestamp": "2022-08-08T22:00:00+02:00"
    //   }
    // ],

    //WE ARE FOLLOWING THE ESKOM SCHEDULE, NOT CPT

    //let countryUpcommingStages = this.loadSheddingStatus[0].next_stages;

    // "events": [
    //   {
    //       "end": "2022-08-08T22:30:00+02:00",
    //       "note": "Stage 2",
    //       "start": "2022-08-08T20:00:00+02:00"
    //   }
    // ],

    let areaEvents = this.areaInfoDataSet?.events!;

    // "days": [
    //   {
    //       "date": "2022-08-08",
    //       "name": "Monday",
    //       "stages": [
    //           [],
    //           [
    //               "20:00-22:30"
    //           ],
    //           [
    //               "12:00-14:30",
    //               "20:00-22:30"
    //           ],

    const areaInfoScheduleDays = this.areaInfoDataSet?.schedule.days.map(day => day)!;

    //WHAT ARE WE RETURNING?
    //ONLY RETURN THE PARENT ARRAY FOR THE CURRENT STAGE
    //ONLY RETURN THE CHILD RECORDS THAT ARE GREAT THAN THE TIME RIGHT NOW.

    let aid: AreaInfoDayEntity[] = [];
    areaInfoScheduleDays.forEach(_day => {
      let ucs: EskomAreaInfoStage[] = [];
      _day._stages.forEach(_stage => {

        let us: string[] = [];

        let stageActiveCondition = areaEvents.some(_ups => {
          let ups_number = _ups.note.substring(_ups.note.length - 1, _ups.note.length);
          return parseInt(ups_number) == _stage.stage;
        });

        if (stageActiveCondition) {
          _stage.timeSlots.forEach(_slot => {
            let slotTime = _slot.split('-');
            let timeData = slotTime[0].split(':');
            let slotDate = new Date(_day.date);
            slotDate.setHours(parseInt(timeData[0]), parseInt(timeData[1]), 0);

            let timeIsGreater = slotDate >= currentUserDate;
            let dayIsGreater = new Date(_day.date) >= currentUserDate;

            if (timeIsGreater || dayIsGreater) {
              us.push(_slot);
            }
          });

          if (us.length > 0) {
            ucs.push({
              stage: _stage.stage,
              name: _stage.name,
              timeSlots: us
            });
          }
        }
      });

      if (ucs.length > 0) {
        aid.push({
          date: _day.date,
          name: _day.name,
          stages: _day.stages,
          _stages: ucs
        });
      }
    });

    this.areaSchedulesUpcomming = aid;
  }

}
