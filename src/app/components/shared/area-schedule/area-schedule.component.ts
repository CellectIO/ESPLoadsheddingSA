import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../card/card.component';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { UtilityService } from '../../../services/utility/utility.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-area-schedule',
  standalone: true,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    CommonModule,
    CardComponent,
    TranslateModule
  ],
  templateUrl: './area-schedule.component.html',
  styleUrl: './area-schedule.component.sass'
})
export class AreaScheduleComponent implements OnInit, OnChanges {

  @Input() areaInfoDataSet: AreaInfoEntity | null = null;

  areaSchedules: AreaInfoDayEntity[] = [];
  scheduleDateFilters: string[] = [];
  scheduleStageFilters: string[] = [];

  scheduleDateFilterControl = new FormControl(['']);
  scheduleStageFilterControl = new FormControl(['']);

  constructor(public ngStyleService: NgStyleService,
    private scheduleService: ScheduleService,
    private utility: UtilityService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.areaInfoDataSet) {
      this.applyAreaScheduleFilters();
    }
  }

  ngOnInit(): void {
    if (this.areaInfoDataSet) {
      this.syncFilters();
      this.applyAreaScheduleFilters();
    }
  }

  syncFilters() {
    let currentDate = this.scheduleService.localeDateString;

    //SET AVAILABLE STAGE FILTER
    this.scheduleStageFilters = this.areaInfoDataSet!.schedule.days[0]._stages.map(x => x.name)!;
    this.scheduleStageFilterControl.setValue(this.scheduleStageFilters);

    //SET AVAILABLE DAYS FILTER + SET CURRENT DATE AS ACTIVE FILTER.
    this.scheduleDateFilters = this.areaInfoDataSet!.schedule.days!.map(x => x.name)!;
    let dsCurrentDate = this.scheduleDateFilters.filter(x => x == currentDate);
    this.scheduleDateFilterControl.setValue(dsCurrentDate);
  }

  applyAreaScheduleFilters() {
    let daysFilter = this.scheduleDateFilterControl.value!;
    let stageFilter = this.scheduleStageFilterControl.value!;

    let schedules = this.utility.newArray(this.areaInfoDataSet!.schedule.days!);
    let validDays = schedules
      .filter(x => daysFilter.some(y => y == x.name))
      .map(day => {
        day._stages = day._stages.filter(_ => stageFilter.some(x => x == _.name));
        return day;
      });

    this.areaSchedules = validDays;
  }

}
