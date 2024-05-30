import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../card/card.component';
import { ScheduleService } from '../../../services/schedule/schedule.service';

@Component({
  selector: 'app-area-schedule',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    CardComponent
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
    private scheduleService: ScheduleService
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

    //IF THIS LOOKS DUMB, ITS BECAUSE IT IS
    //DUE TO ARRAY's BEING REFERENCE TYPES, IF I MODIFY THE ARRAY CONTENT LIKE I DO BELOW IT WILL RESULT IN THE ORIGINAL ARRAY TO BE MODIFIED ASWELL.
    //SO I AM PARSING IT TO JSON AND BACK INTO THE ORIGINAL TYPE
    //TO MAKE THE COMPILER THINK ITS A BRAND NEW ARRAY AND BREAKING THE REFERENCE ISSUE.
    let schedules = JSON.parse(JSON.stringify(this.areaInfoDataSet!.schedule.days!)) as AreaInfoDayEntity[];

    let validDays = schedules
      .filter(x => daysFilter.some(y => y == x.name))
      .map(day => {
        day._stages = day._stages.filter(_ => stageFilter.some(x => x == _.name));
        return day;
      });

    this.areaSchedules = validDays;
  }

}
