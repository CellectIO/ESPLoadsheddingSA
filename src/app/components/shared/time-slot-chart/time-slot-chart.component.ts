import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgStyleService } from '../../../services/ng-style/ng-style.service';
import { AreaInfoDayEntity } from '../../../core/models/entities/area-info-entity';

export interface timeSegment{
  active: boolean;
  segmentColor: string;
  fromTime: string;
  toTime: string;
  currentTime: boolean;
}

@Component({
  selector: 'app-time-slot-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-slot-chart.component.html',
  styleUrl: './time-slot-chart.component.sass'
})
export class TimeSlotChartComponent implements OnInit, OnChanges{
  
  @Input() infoDay: AreaInfoDayEntity | null = null;
  timeFragments: timeSegment[] = [];

  constructor(public ngStyleService: NgStyleService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.syncChart();
  }

  ngOnInit(): void {
    this.syncChart();
  }

  syncChart(){
    
    this.timeFragments = [];

    let userDateTime = new Date();
    let userTotalMinuts = (userDateTime.getHours() * 60) + userDateTime.getMinutes();

    //LOAD EMPTY CHART DATA
    let currentMinutes = 0;
    for (let index = 0; index < 48; index++) {

      let cm = currentMinutes;
      currentMinutes += 30;
      let nm = currentMinutes;

      let cm_time = (cm / 60).toString().split('.'); //determine hour string based on value
      let nm_time = (nm / 60).toString().split('.'); //determine hour string based on value

      this.timeFragments.push({
        active: false,
        segmentColor: 'stage0-bg-color',
        fromTime: this.getdoubleDigitTime(cm_time[0], cm_time[1]),
        toTime: this.getdoubleDigitTime(nm_time[0], nm_time[1]),
        currentTime: (userTotalMinuts >= cm) && (userTotalMinuts <= nm)
      });
    }

    this.infoDay?._stages.forEach(infoStage => {
      infoStage.timeSlots.forEach(timeSlot => {
        let timeDetails = timeSlot.split('-');
        let fromSegment = this.timeFragments.filter(tf => tf.fromTime == timeDetails[0])[0];
        let fromSementIndex = this.timeFragments.indexOf(fromSegment);
        let toSegment = this.timeFragments.filter(tf => tf.fromTime == timeDetails[1])[0];
        let toSementIndex = this.timeFragments.indexOf(toSegment);

        for (let i = fromSementIndex; i < toSementIndex; i ++) {
          this.timeFragments[i].active = true;
          this.timeFragments[i].segmentColor = this.ngStyleService.getStageBgColor(infoStage.stage);
        }

      })
    });
  }

  
  getdoubleDigitTime(fromTime: string, toTime: string){
    return ('0' + fromTime).slice(-2) + ":" + (toTime == undefined ? '00' : toTime.replace('5', '30'))
  }

}
