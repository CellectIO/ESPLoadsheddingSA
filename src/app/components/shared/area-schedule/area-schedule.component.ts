import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EskomAreaInfoStage } from '../../../core/models/common/areas/eskom-area-info-stage';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../../core/models/entities/area-info-entity';
import { CardComponent } from '../card/card.component';

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
  @Input() areaSchedules: AreaInfoDayEntity[] = [];

  scheduleDateFilterControl = new FormControl(['']);
  scheduleDateFilters: string[] = [];
  scheduleStageFilterControl = new FormControl(['']);
  scheduleStageFilters: string[] = [];

  constructor(public ngStyleService: NgStyleService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.areaInfoDataSet && this.areaSchedules) {
      this.syncAreaShceduleFilter();
      this.applyAreaScheduleFilters();
    }
  }

  ngOnInit(): void {
    if (this.areaInfoDataSet && this.areaSchedules) {
      this.syncAreaShceduleFilter();
      this.applyAreaScheduleFilters();
    }
  }

  syncAreaShceduleFilter() {
    //SET THE AVAILABLE DAYS TO FILTER ON
    this.scheduleDateFilters = this.areaInfoDataSet?.schedule.days!.map(x => x.name)!;
    this.scheduleStageFilters = this.areaInfoDataSet?.schedule.days[0]._stages.map(x => x.name)!;

    //DEFAULT THE FILTER TO TODAYS DATE
    let currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let dsCurrentDate = this.scheduleDateFilters.filter(x => x == currentDate);
    this.scheduleDateFilterControl.setValue(dsCurrentDate);
    this.scheduleStageFilterControl.setValue(this.scheduleStageFilters);
  }

  applyAreaScheduleFilters() {
    let controlValues = this.scheduleDateFilterControl.value!;
    let stageValues = this.scheduleStageFilterControl.value!;
    const tempds = this.areaInfoDataSet?.schedule.days.map(day => day)!;

    //TODO: FIX _stages not binding correctly
    this.areaSchedules = tempds
      .filter(x => {
        return controlValues!.some(y => y == x.name)
      })
      .map(x => {
        let validChildren: EskomAreaInfoStage[] = [];
        x._stages.forEach(stage => {
          if (stageValues.some(x => x == stage.name)) {
            validChildren.push(stage);
          }
        });

        x._stages = validChildren;
        return x;
      })!;
  }

}
