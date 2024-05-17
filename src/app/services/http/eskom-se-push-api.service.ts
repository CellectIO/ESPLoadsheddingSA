import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ESPStatusApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-status-api-response';
import { ESPAreaInfoApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-info-api-response';
import { ESPAreasNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-areas-nearby-api-response';
import { ESPTopicsNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-topics-nearby-api-response';
import { ESPAllowanceApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-allowance-api-response';
import { SessionStorageService } from '../storage/session-storage.service';
import { EskomSePushConfig } from '../../core/models/common/Settings/user-app-settings';
import { environment } from '../../../environments/environment';
import { IEskomSePushApiService } from '../../core/contracts/services/eskom-se-push-api.service';
import { ESPAreaSearchApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-search-api-response';
import { StorageServiceKeyConstants } from '../../core/constants/storage-service-key.constants';
import { Result } from '../../core/models/response-types/result';
import { NGXLogger } from 'ngx-logger';
import { DbService } from '../db/db.service';

@Injectable({
  providedIn: 'root'
})
export class EskomSePushApiService implements IEskomSePushApiService{

  constructor(
    private http: HttpClient, 
    private storageService: SessionStorageService,
    private logger: NGXLogger
    ) {}

  getStatus(): Observable<Result<ESPStatusApiResponse>> {
    this._log('getStatus', []);
    return this.handleHttpRequest<ESPStatusApiResponse>(`${environment.api_eskom}/status`);
  }

  getAreaInformation(areaId: string): Observable<Result<ESPAreaInfoApiResponse>> {
    this._log('getAreaInformation', [areaId]);
    return this.handleHttpRequest<ESPAreaInfoApiResponse>(`${environment.api_eskom}/area?id=${areaId}`);
  }

  getAreasNearby(lat: number, long:number): Observable<Result<ESPAreasNearbyApiResponse>> {
    this._log('getAreasNearby', [lat, long]);
    return this.handleHttpRequest<ESPAreasNearbyApiResponse>(`${environment.api_eskom}/areas_nearby?lat=${lat}8&lon=${long}`);
  }

  getArea(areaName: string): Observable<Result<ESPAreaSearchApiResponse>> {
    this._log('getArea', [areaName]);
    return this.handleHttpRequest<ESPAreaSearchApiResponse>(`${environment.api_eskom}/areas_search?text=${areaName}`);
  }

  getTopicsNearby(lat: number, long:number): Observable<Result<ESPTopicsNearbyApiResponse>> {
    this._log('getTopicsNearby', [lat, long]);
    return this.handleHttpRequest<ESPTopicsNearbyApiResponse>(`${environment.api_eskom}/topics_nearby?lat=${lat}8&lon=${long}`);
  }

  getAllowance(): Observable<Result<ESPAllowanceApiResponse>> {
    this._log('getAllowance', []);
    return this.handleHttpRequest<ESPAllowanceApiResponse>(`${environment.api_eskom}/api_allowance`);
  }

  private handleHttpRequest<T>(url: string): Observable<Result<T>> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Request-Method': 'GET',
      'Access-Control-Allow-Origin': '*',
      'Token': ''
    });

    let configExists = this.storageService.keyExists(StorageServiceKeyConstants.USER_DATA_SETTINGS);
    if(configExists){
      let configResult = this.storageService.getData<EskomSePushConfig>(StorageServiceKeyConstants.USER_DATA_SETTINGS);
      if(configResult.isSuccess){
        headers = headers.set('Token', configResult.data!.eskomSePushApiKey!);
      }else{
        let error = 'API KEY : Eskom Se Push API KEY has been set but no data was found.';
        this.logger.warn(error);
        return of(new Result<T>(null, [error]));
      }
    }else{
      let error = 'API KEY : Eskom Se Push API KEY has not been set yet.';
      this.logger.warn(error);
      return of(new Result<T>(null, [error]));
    }

    return this.http
      .get<T>(url, { 
        headers: headers, 
        withCredentials: true 
      })
      .pipe(
        map((data: T) => {
          this.logger.info(`httpRequest with url [${url}] returned a succesfull response`);
          return new Result<T>(data, null);
        }),
        catchError(error => {
          this.logger.error(`httpRequest with url [${url}] returned a failed response with error [${error.message}]`);
          return of(new Result<T>(null, [error.message]));
        })
      );
  }

  private _log(functionName: string, params: any[]){
    this.logger.info(`invoking ${functionName}() with params ${params}`);
  }

}