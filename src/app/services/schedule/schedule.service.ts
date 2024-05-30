import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  public get localeDateString():string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }

  constructor() { }

}
