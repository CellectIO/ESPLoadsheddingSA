import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TimeSlotChartComponent } from '../time-slot-chart/time-slot-chart.component';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { CommonModule } from '@angular/common';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../card/card.component';
import { ScheduleService } from '../../../services/schedule/schedule.service';

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

  @Input() areaInfoDataSet: AreaInfoEntity | null = null;

  areaSchedulesUpcomming: AreaInfoDayEntity[] = [];

  constructor(
    public ngStyleService: NgStyleService,
    private scheduleService: ScheduleService
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
    this.areaSchedulesUpcomming = this.scheduleService.syncUpcommingSchedule(this.areaInfoDataSet!);
  }

}
