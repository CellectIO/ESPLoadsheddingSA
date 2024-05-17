import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Result } from '../../core/models/response-types/result';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor() { }

  getCurrentPosition(): Observable<Result<GeolocationPosition>>
  {
    return new Observable<Result<GeolocationPosition>>((observer) => {
      navigator.geolocation.getCurrentPosition((resp) => {
        observer.next(new Result<GeolocationPosition>(resp, null));
        observer.complete();
        },
        err => {
         observer.error(err);
        }
      );
    });
  }

}
