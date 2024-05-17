import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ESPAllowanceApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-allowance-api-response';
import { ESPAreaInfoApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-info-api-response';
import { ESPAreasNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-areas-nearby-api-response';
import { ESPStatusApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-status-api-response';
import { ESPTopicsNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-topics-nearby-api-response';
import getStatus from '../../../assets/api-mock-data/getStatus.json';
import getAreaInformation from '../../../assets/api-mock-data/getAreaInformation.json';
import getAreasNearby from '../../../assets/api-mock-data/getAreasNearby.json';
import getArea from '../../../assets/api-mock-data/getArea.json';
import getTopicsNearby from '../../../assets/api-mock-data/getTopicsNearby.json';
import getAllowance from '../../../assets/api-mock-data/getAllowance.json';
import { IEskomSePushApiService } from '../../core/contracts/services/eskom-se-push-api.service';
import { ESPAreaSearchApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-search-api-response';
import { Result } from '../../core/models/response-types/result';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class EskomSePushMockApiService implements IEskomSePushApiService {

  constructor(private logger: NGXLogger) { }

  getStatus(): Observable<Result<ESPStatusApiResponse>> {
    this._log('getStatus', []);
    let rawData = getStatus as ESPStatusApiResponse;
    return this.returnJson<ESPStatusApiResponse>(rawData);
  }

  getAreaInformation(areaId?: string): Observable<Result<ESPAreaInfoApiResponse>> {
    this._log('getAreaInformation', [areaId]);
    let rawData = getAreaInformation as ESPAreaInfoApiResponse;
    return this.returnJson<ESPAreaInfoApiResponse>(rawData);
  }

  getAreasNearby(lat?: number, long?: number): Observable<Result<ESPAreasNearbyApiResponse>> {
    this._log('getAreasNearby', [lat, long]);
    let rawData = getAreasNearby as ESPAreasNearbyApiResponse;
    return this.returnJson<ESPAreasNearbyApiResponse>(rawData);
  }

  getArea(areaName?: string): Observable<Result<ESPAreaSearchApiResponse>> {
    this._log('getArea', [areaName]);
    let rawData = getArea as ESPAreaSearchApiResponse;
    return this.returnJson<ESPAreaSearchApiResponse>(rawData);
  }

  getTopicsNearby(lat?: number, long?: number): Observable<Result<ESPTopicsNearbyApiResponse>> {
    this._log('getTopicsNearby', [lat, long]);
    let rawData = getTopicsNearby as ESPTopicsNearbyApiResponse;
    return this.returnJson<ESPTopicsNearbyApiResponse>(rawData);
  }

  getAllowance(): Observable<Result<ESPAllowanceApiResponse>> {
    this._log('getAllowance', []);
    let rawData = getAllowance as ESPAllowanceApiResponse;
    return this.returnJson<ESPAllowanceApiResponse>(rawData);
  }

  private returnJson<TResponse>(data: TResponse): Observable<Result<TResponse>>
  {
    return of(new Result<TResponse>(data, null));
  }

  private _log(functionName: string, params: any[]){
    this.logger.info(`invoking ${functionName}() with params ${params}`);
  }

}
