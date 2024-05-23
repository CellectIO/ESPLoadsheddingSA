import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogPanelService {

  private _errorLogs: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private _successLogs: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private _warningLogs: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  public get errorLogs(): Observable<string[]> {
    return this._errorLogs.asObservable();
  }

  public get successLogs(): Observable<string[]> {
    return this._successLogs.asObservable();
  }

  public get warningLogs(): Observable<string[]> {
    return this._warningLogs.asObservable();
  }
  
  constructor() { }

  public setSuccessLogs(logs: string[]){
    this._successLogs.next(logs);
  }

  public setErrorLogs(logs: string[]){
    this._errorLogs.next(logs);
  }

  public setWarningLogs(logs: string[]){
    this._warningLogs.next(logs);
  }

}
