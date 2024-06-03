import { Injectable } from '@angular/core';
import { NgStyleService } from '../ng-style/ng-style.service';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../core/models/entities/area-info-entity';
import { EskomAreaInfoEvent } from '../../core/models/common/areas/eskom-area-info-event';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { EskomAreaInfoStage } from '../../core/models/common/areas/eskom-area-info-stage';
import { UtilityService } from '../utility/utility.service';

export interface timeSegment {
  /**
   * Determines the Color of the Segment based on the Stage it falls in.
   */
  stageColor: string;
  /**
   * Determins the Starting time for the segment.
   */
  fromTime: string;
  /**
   * Determines the Ending time for the segment.
   */
  toTime: string;
  /**
   * Determines if the current time falls in the segment
   */
  containsCurrentTime: boolean;
  /**
   * Determines if the first segment in the stage range should show the time.
   */
  shouldRenderStartingTime: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  public get localeDateString(): string {
    return this.currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  public get now(): number {
    return Date.now();
  }

  public get currentDate(): Date {
    return environment.mocking.useMockTime ?
      new Date(environment.mocking.mockTime) :
      new Date();
  }

  constructor(
    private styleService: NgStyleService,
    private utilityService: UtilityService
  ) { }

  parseSegmentTime(analogTime: string) {
    const [hours, minutes] = analogTime.split(':');
    const date = this.currentDate;
    date.setHours(+hours);
    date.setMinutes(+minutes);
    return new DatePipe('en').transform(date, 'h a');
  }

  getSlotDateTime(slotTimeRange: string, slotDay: string, useFromTime: boolean): Date {
    let fromToTimes = slotTimeRange.split('-');
    let hoursMinutes = fromToTimes[useFromTime ? 0 : 1].split(':');
    let slotDate = new Date(slotDay);
    slotDate.setHours(parseInt(hoursMinutes[0]), parseInt(hoursMinutes[1]), 0);
    return slotDate
  }

  getdoubleDigitTime(fromTime: string, toTime: string) {
    return ('0' + fromTime).slice(-2) + ":" + (toTime == undefined ? '00' : toTime.replace('5', '30'))
  }

  createTimeFragments(): timeSegment[] {
    let timeFragments: timeSegment[] = [];
    let userDateTime = this.currentDate;
    let userTotalMinuts = (userDateTime.getHours() * 60) + userDateTime.getMinutes();
    let currentMinutes = 0;

    //NOTE:
    //SHOULD RENDER 48 SEGMENTS
    //EACH SEGMENT WOULD BE 30 MINS TO EQUAL A 24 HOUR DAY
    for (let index = 0; index < 48; index++) {

      let prevCurrentMinutes = currentMinutes;
      currentMinutes += 30;
      let newCurrentMinutes = currentMinutes;

      let cm_time = (prevCurrentMinutes / 60).toString().split('.');
      let nm_time = (newCurrentMinutes / 60).toString().split('.');

      timeFragments.push({
        stageColor: 'stage0-bg-color',
        fromTime: this.getdoubleDigitTime(cm_time[0], cm_time[1]),
        toTime: this.getdoubleDigitTime(nm_time[0], nm_time[1]),
        containsCurrentTime: (userTotalMinuts >= prevCurrentMinutes) && (userTotalMinuts < newCurrentMinutes),
        shouldRenderStartingTime: false
      });
    }

    return timeFragments;
  }

  syncTimeFragmentsWithSchedule(timeFragments: timeSegment[], day: AreaInfoDayEntity, areaEvents: EskomAreaInfoEvent[]): timeSegment[] {
    day._stages.forEach(stage => {
      //STEP: DETERMINE WHAT SCHEDULES SHOULD BE RENDERED ON THE SEGMENTS
      let slots = stage.timeSlots.filter(_slot => {
        let slotDate = this.getSlotDateTime(_slot, day.date, false);
        let slotsInsideActiveEvents = this.filterActiveSlotsForEvents(stage, slotDate, areaEvents);
        return this.isValidTimeSlot(slotsInsideActiveEvents.length, slotDate);
      });

      //STEP: HIGHLIGHT THE FRAGMENTS WITH THE APPROPRIATE STAGE COLORS
      slots.forEach(timeSlot => {
        let timeDetails = timeSlot.split('-');
        let fromSegment = timeFragments.filter(tf => tf.fromTime == timeDetails[0])[0];
        let fromSegmentIndex = timeFragments.indexOf(fromSegment);
        let toSegment = timeFragments.filter(tf => tf.fromTime == timeDetails[1])[0];
        let toSementIndex = timeFragments.indexOf(toSegment);

        let slotDate = this.getSlotDateTime(timeSlot, day.date, true);

        for (let i = fromSegmentIndex; i < toSementIndex; i++) {
          //ONLY SLOT STARTING SEGMENT IF ITS UPCOMMING
          timeFragments[i].shouldRenderStartingTime = (i == fromSegmentIndex) && slotDate > this.currentDate;
          timeFragments[i].stageColor = this.styleService.getStageBgColor(stage.stage);
        }
      })
    });

    //STEP: ONLY RENDER THE CURRENT TIME FAGMENT IF THE DAY IS TODAY
    if(new Date(day.date).getDate() != this.currentDate.getDate()){
      timeFragments.forEach(frag => frag.containsCurrentTime = false);
    }

    return timeFragments;
  }

  syncUpcommingSchedule(areaInfo: AreaInfoEntity): AreaInfoDayEntity[] {
    let areaEvents = areaInfo?.events!;
    let newAreaInfo = this.utilityService.newArray(areaInfo?.schedule.days);

    let test = newAreaInfo.map(day => {
      day._stages = day._stages.filter(stage => {
        stage.timeSlots = stage.timeSlots.filter(_slot => {
          let slotDate = this.getSlotDateTime(_slot, day.date, false);
          let slotsInsideActiveEvents = this.filterActiveSlotsForEvents(stage, slotDate, areaEvents);
          return this.isValidTimeSlot(slotsInsideActiveEvents.length, slotDate);
        });

        return stage.timeSlots.length > 0;
      });

      return day;
    }).filter(_ => _._stages.length > 0);

    return test;
  }

  filterActiveSlotsForEvents(stage: EskomAreaInfoStage, slotDate: Date, areaEvents: EskomAreaInfoEvent[]){
    let slotsInsideActiveEvents = areaEvents.filter(event => {
      let eventStage = event.note.substring(event.note.length - 1, event.note.length);
      let stageMatches = (parseInt(eventStage) == stage.stage);
      let slotDateInsideEvent = (slotDate <= new Date(event.start) && slotDate >= new Date(event.end));
      return stageMatches && slotDateInsideEvent;
    });
    return slotsInsideActiveEvents;
  }

  isValidTimeSlot(eventsLength: number, slotDate: Date){
    //DETERMINE IF THE TIME SLOT FITS IN WITH THE EVENT
    if (eventsLength <= 0) {
      return false;
    }

    //THEN DETERMINE IF THE CURRENT SLOT END TIME IS GREATER THAN THE CURRENT TIME, SLOT SHOULD BE isActive
    return (slotDate >= this.currentDate);
  }

}
