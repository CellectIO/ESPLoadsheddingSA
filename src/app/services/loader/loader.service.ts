import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private _appLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public get appLoading(): Observable<boolean> {
    return this._appLoading.asObservable();
  }

  constructor() { }

  setAppLoading(isLoading: boolean){
    this._appLoading.next(isLoading);
  }

}
