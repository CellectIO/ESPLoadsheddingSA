import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  public get localeDateString():string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }

  public get now(): number{
    return Date.now();
  }

  public get currentDate(): Date{
    return new Date();
  }

  constructor() { }

}
