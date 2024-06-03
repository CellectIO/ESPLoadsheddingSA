import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { ScheduleService, timeSegment } from '../../../services/schedule/schedule.service';
import { EskomAreaInfoEvent } from '../../../core/models/common/areas/eskom-area-info-event';

@Component({
  selector: 'app-time-slot-chart',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './time-slot-chart.component.html',
  styleUrl: './time-slot-chart.component.sass'
})
export class TimeSlotChartComponent implements OnInit, OnChanges{
  
  @Input() areaEvents: EskomAreaInfoEvent[] = [];
  @Input() areaDayInfo: AreaInfoDayEntity | null = null;
  
  timeFragments: timeSegment[] = [];

  constructor(public ngStyleService: NgStyleService,
    public scheduleService: ScheduleService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.syncChart();
  }

  ngOnInit(): void {
    this.syncChart();
  }

  syncChart(){
    this.timeFragments = [];
    this.timeFragments = this.scheduleService.createTimeFragments();
    this.timeFragments = this.scheduleService.syncTimeFragmentsWithSchedule(this.timeFragments, this.areaDayInfo!, this.areaEvents!);
  }

}
