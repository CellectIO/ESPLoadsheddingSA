import { Injectable } from "@angular/core";
import { IEskomSePushApiService } from "../../core/contracts/services/eskom-se-push-api.service";
import { BehaviorSubject, Observable, map, of, switchMap } from "rxjs";
import { AreaSearchEntity } from "../../core/models/entities/area-search-entity";
import { StatusEntity } from "../../core/models/entities/status-entity";
import { AreaInfoEntity } from "../../core/models/entities/area-info-entity";
import { AreasNearbyEntity } from "../../core/models/entities/areas-nearby-entity";
import { AllowanceEntity } from "../../core/models/entities/allowance-entity";
import { EskomSePushApiService } from "../http/eskom-se-push-api.service";
import { EskomSePushMockApiService } from "../http/eskom-se-push-mock-api.service";
import { SessionStorageService } from "../storage/session-storage.service";
import { EskomSePushEntityMapperService } from "../mappers/eskom-se-push-entity-mapper.service";
import { NGXLogger } from "ngx-logger";
import { environment } from "../../../environments/environment";
import { StorageServiceKeyConstants } from "../../core/constants/storage-service-key.constants";
import { EskomSePushConfig } from "../../core/models/common/Settings/user-app-settings";
import { Result } from "../../core/models/response-types/result";
import { ResultBase } from "../../core/models/response-types/result-base";
import { ApiUtilizationBreakdown } from "../../core/models/common/allowance/api-utilization-breakdown";
import { ScheduleService } from "../schedule/schedule.service";

@Injectable({
  providedIn: 'root'
})
export class DbService {

  private _sync: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public get sync$(): Observable<number> {
    return this._sync.asObservable();
  }

  private _apiService: IEskomSePushApiService;

  constructor(
    private apiService: EskomSePushApiService,
    private mockApiService: EskomSePushMockApiService,
    private storageService: SessionStorageService,
    private mapper: EskomSePushEntityMapperService,
    private logger: NGXLogger,
    private scheduleService: ScheduleService
  ) {
    this._apiService = environment.mocking.useMock ? mockApiService : apiService;
    this.logger.info(`Using Mock Http Service : ${environment.mocking.useMock}`);
  }

  public validateApiKey(apiKey: string): Observable<ResultBase> {
    return this.apiService.validateApiKey(apiKey)
      .pipe(
        map(result => {
          return result.isSuccess ?
            new ResultBase(null) :
            new ResultBase([result.data?.error!]);
        })
      );
  }

  public isRegistered(): ResultBase {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_SETTINGS

    let settingsExists = this.storageService.keyExists(cacheKey);
    if (!settingsExists.isSuccess) {
      return new ResultBase(settingsExists.errors);
    }

    let cacheSettings = this.storageService.getData<EskomSePushConfig>(cacheKey)!;
    let keyExists = (cacheSettings.data!.eskomSePushApiKey) ? true : false;
    return keyExists ?
      new ResultBase(null) :
      new ResultBase(['Eskom Se Push API Key has not been saved yet.']);
  }

  //#region "GET"

  public searchArea(areaName: string): Observable<Result<AreaSearchEntity>> {
    let cacheKey = StorageServiceKeyConstants.API_RESPONSE_GETAREA;

    return this._apiService.getArea(areaName)
      .pipe(
        switchMap((searchResult) => {
          if (searchResult.isSuccess == false) {
            this.logger.warn(`${typeof (DbService)}: searchArea() failed to return a succesfull response. [${searchResult.errors}]`);
            return of(new Result<AreaSearchEntity>(null, searchResult.errors));
          }

          let searchReslt = this.mapper.toAreaSearchEntity(searchResult.data!);

          //SAVE THE SEARCH RESULT
          //TODO: NOT SURE WHY WE WOULD SAVE THIS RESULT JUST YET?
          let cacheSearchEntities: AreaSearchEntity;
          var cachedResponse = this.storageService.getData<AreaSearchEntity>(cacheKey);
          if (cachedResponse.isSuccess) {
            cacheSearchEntities = cachedResponse.data!;
          } else {
            cacheSearchEntities = {
              areas: []
            };
          }

          searchReslt.areas.forEach(area => {
            cacheSearchEntities.areas.push(area);
          });

          //SINCE WE DON"T HAVE ANYHTING TO DO WITH THE CACHE JUST YET, LET THE CACHE STAY ALIVE FOR 1 DAY?
          let expiresIn = 60 * 24;
          let saveResult = this._saveToCache<AreaSearchEntity>(cacheKey, cacheSearchEntities, true, expiresIn);
          return saveResult.isSuccess ?
            of(new Result<AreaSearchEntity>(searchReslt, null)) :
            of(new Result<AreaSearchEntity>(null, saveResult.errors));
        }),
        switchMap(result => {
          if (result.isSuccess) {
            return this._updateAllowanceEntity('getArea')
              .pipe(
                map(updateResult => {
                  return updateResult.isSuccess ?
                    new Result<AreaSearchEntity>(result.data, null) :
                    new Result<AreaSearchEntity>(null, updateResult.errors);
                })
              );
          }

          return of(result);
        }),
        map(Result => {
          return Result;
        })
      );
  }

  public getSavedOrDefaultAreas(): Observable<Result<AreaSearchEntity>> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_SAVED_AREAS;
    let cachedResult = this._getFromCache<AreaSearchEntity>(cacheKey);
    if (cachedResult.isSuccess) {
      return of(new Result<AreaSearchEntity>(cachedResult.data, null));
    }

    var defaultSaved: AreaSearchEntity = {
      areas: []
    };

    var saveResult = this._saveToCache<AreaSearchEntity>(cacheKey, defaultSaved, false);

    return saveResult.isSuccess ?
      of(new Result<AreaSearchEntity>(defaultSaved, null)) :
      of(new Result<AreaSearchEntity>(null, saveResult.errors));
  }

  public getSavedOrDefaultUserSettings(): Observable<Result<EskomSePushConfig>> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_SETTINGS;
    let cachedResult = this._getFromCache<EskomSePushConfig>(cacheKey);
    if (cachedResult.isSuccess) {
      return of(new Result<EskomSePushConfig>(cachedResult.data, null));
    }

    var defaultSaved: EskomSePushConfig = {
      eskomSePushApiKey: null,
      apiSyncInterval: environment.cache.defaultExpiresInMinutes,
      pagesSetup: false,
      pagesAllowance: true
    };

    var saveResult = this._saveToCache<EskomSePushConfig>(cacheKey, defaultSaved, false);

    return saveResult.isSuccess ?
      of(new Result<EskomSePushConfig>(defaultSaved, null)) :
      of(new Result<EskomSePushConfig>(null, saveResult.errors));
  }

  public getLatestOrDefaultAllowance(): Observable<Result<AllowanceEntity>> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_ALLOWANCE;

    return this._apiService.getAllowance().pipe(
      map((allowanceResult) => {
        if (allowanceResult.isSuccess == false) {
          this.logger.warn(`${typeof (DbService)}: updateAllowance() failed to return a succesfull response. [${allowanceResult.errors}]`);
          return new Result<AllowanceEntity>(null, allowanceResult.errors);
        }

        //GET THE ALLOWANCE UTIL BREADOWN
        let utilBreakdown: ApiUtilizationBreakdown
        var cachedResponse = this.storageService.getData<AllowanceEntity>(cacheKey);
        if (cachedResponse.isSuccess) {
          utilBreakdown = cachedResponse.data!.apiUtilizationBreakdown;
        } else {
          utilBreakdown = {
            getStatus: 0,
            getAreaInformation: 0,
            getAreasNearby: 0,
            getArea: 0,
            getTopicsNearby: 0,
          };
        }

        //SAVE THE LATEST ALLOWANCE RESULT TO CACHE

        //SINCE THE API COUNT FOR DAILY USERS EXPIRE EVERY DAY DETERMINE HOW MANY MINUTES ARE LEFT OF THE DAY
        //TODO: HAVE LOGIC HERE FOR NON DAILY API USERS ?
        let expiresIn = this.scheduleService.minutesUntilTomorrow();
        let entityData = this.mapper.toAllowanceEntity(allowanceResult.data!, utilBreakdown);
        var saveResult = this._saveToCache<AllowanceEntity>(cacheKey, entityData, true, expiresIn);

        return saveResult.isSuccess ?
          new Result<AllowanceEntity>(entityData, null) :
          new Result<AllowanceEntity>(null, saveResult.errors);
      })
    );
  }

  public getStatus(): Observable<Result<StatusEntity>> {
    let cacheKey = StorageServiceKeyConstants.API_RESPONSE_GETSTATUS;
    let cachedResult = this._getFromCache<StatusEntity>(cacheKey);
    if (cachedResult.isSuccess) {
      return of(new Result<StatusEntity>(cachedResult.data, null));
    }

    let response: StatusEntity | null = null;
    return this._apiService.getStatus()
      .pipe(
        switchMap(value => {
          if (value.isSuccess == false) {
            let error = `${typeof (DbService)}: getStatus() failed to return a succesfull response. [${value.errors}]`;
            this.logger.warn(error);
            return of(new ResultBase([error]));
          }

          response = this.mapper.toStatusEntity(value.data!);
          let saveResult = this._saveToCache<StatusEntity>(cacheKey, response, true);
          return of(saveResult);
        }),
        switchMap(getOrSaveResult => {
          if (getOrSaveResult.isSuccess == false) {
            return of(getOrSaveResult);
          }

          return this._updateAllowanceEntity('getStatus');
        }),
        map(result => {
          return result.isSuccess ?
            new Result<StatusEntity>(response!, null) :
            new Result<StatusEntity>(null, result.errors);
        })
      );
  }

  public getAreaInformation(areaInfoId: string): Observable<Result<AreaInfoEntity>> {
    let cacheKey = StorageServiceKeyConstants.API_RESPONSE_GETAREAINFO;

    let cachedResult = this._getFromCache<AreaInfoEntity[]>(cacheKey);
    if (cachedResult.isSuccess) {
      let targetAreaInfo = cachedResult.data!.filter(_ => _.areaInfoId == areaInfoId);
      if (targetAreaInfo.length > 0) {
        return of(new Result<AreaInfoEntity>(targetAreaInfo[0], null));
      }
    }

    return this._apiService.getAreaInformation(areaInfoId)
      .pipe(
        switchMap((getAreaInfoResult) => {
          if (getAreaInfoResult.isSuccess == false) {
            this.logger.warn(`${typeof (DbService)}: addAreaInformation() failed to return a succesfull response. [${getAreaInfoResult.errors}]`);
            return of(new Result<AreaInfoEntity>(null, getAreaInfoResult.errors));
          }

          let entityData = this.mapper.toAreaInfoEntity(getAreaInfoResult.data!, areaInfoId);

          //SAVE THE AREA INFO
          let cachedAreaInfos: AreaInfoEntity[];
          var cachedResponse = this.storageService.getData<AreaInfoEntity[]>(cacheKey);
          if (cachedResponse.isSuccess) {
            cachedAreaInfos = cachedResponse.data!;
          } else {
            cachedAreaInfos = [];
          }

          cachedAreaInfos.push(entityData);

          let saveResult = this._saveToCache<AreaInfoEntity[]>(cacheKey, cachedAreaInfos, true);
          return saveResult.isSuccess ?
            of(new Result<AreaInfoEntity>(entityData, null)) :
            of(new Result<AreaInfoEntity>(null, saveResult.errors));
        }),
        switchMap(result => {
          if (result.isSuccess) {
            return this._updateAllowanceEntity('getAreaInformation')
              .pipe(
                map(updateResult => {
                  return updateResult.isSuccess ?
                    new Result<AreaInfoEntity>(result.data, null) :
                    new Result<AreaInfoEntity>(null, updateResult.errors);
                })
              );
          }

          return of(result);
        }),
        map(Result => {
          return Result;
        })
      );
  }

  public getAreasNearby(lat: number, long: number): Observable<Result<AreasNearbyEntity>> {
    let cacheKey = StorageServiceKeyConstants.API_RESPONSE_GETAREASNEARBY;

    let cachedResult = this._getFromCache<AreasNearbyEntity>(cacheKey);
    if (cachedResult.isSuccess) {
      if (cachedResult.data!.lat == lat && cachedResult.data!.long == long) {
        return of(new Result<AreasNearbyEntity>(cachedResult.data!, null));
      }
    }

    return this._apiService.getAreasNearby(lat, long)
      .pipe(
        switchMap((searchResult) => {
          if (searchResult.isSuccess == false) {
            this.logger.warn(`${typeof (DbService)}: updateAreasNearby() failed to return a succesfull response. [${searchResult.errors}]`);
            return of(new Result<AreasNearbyEntity>(null, searchResult.errors));
          }

          let searchReslt = this.mapper.toAreasNearbyEntity(searchResult.data!, lat, long);

          let saveResult = this._saveToCache<AreasNearbyEntity>(cacheKey, searchReslt, true);
          return saveResult.isSuccess ?
            of(new Result<AreasNearbyEntity>(searchReslt, null)) :
            of(new Result<AreasNearbyEntity>(null, saveResult.errors));
        }),
        switchMap(result => {
          if (result.isSuccess) {
            return this._updateAllowanceEntity('getAreasNearby')
              .pipe(
                map(updateResult => {
                  return updateResult.isSuccess ?
                    new Result<AreasNearbyEntity>(result.data, null) :
                    new Result<AreasNearbyEntity>(null, updateResult.errors);
                })
              );
          }

          return of(result);
        }),
        map(Result => {
          return Result;
        })
      );
  }

  //#endregion "GET"

  //#region "UPDATE"

  public updateSavedAreas(areas: AreaSearchEntity): Observable<ResultBase> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_SAVED_AREAS;

    let saveResult = this._saveToCache<AreaSearchEntity>(cacheKey, areas, false);

    if (saveResult.isSuccess) {
      this._invokeSync();
      return of(new ResultBase(null));
    }

    return of(new ResultBase(saveResult.errors));
  }

  public updateUserSettings(settings: EskomSePushConfig): Observable<ResultBase> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_SETTINGS;

    return this.getSavedOrDefaultUserSettings()
      .pipe(
        switchMap(savedAreaResult => {
          if (savedAreaResult.isSuccess) {
            return of(this._saveToCache<EskomSePushConfig>(cacheKey, settings, false));
          }

          return of(new ResultBase(savedAreaResult.errors));
        }),
        map(saveResult => {
          if (saveResult.isSuccess) {
            this._invokeSync();
            return new ResultBase(null);
          }

          return new ResultBase(saveResult.errors);
        })
      )
  }

  //#endregion "UPDATE"

  //#region "PRIVATE FUNCTIONS"

  _invokeSync() {
    this._sync.next(Math.random());
    this.logger.info('Invoking Sync');
  }

  private _saveToCache<T>(cacheKey: string, data: T, canCacheExpire: boolean, expiresInMinutesOverride: number | null = null): ResultBase {
    let saveResult = this.storageService.saveData(cacheKey, data, canCacheExpire, expiresInMinutesOverride);
    if (!saveResult.isSuccess) {
      let error = `Something went wrong while trying to save dbSet Value : [${saveResult.errors}]`;
      this.logger.warn(error);
      return new ResultBase([error]);
    }

    return new ResultBase(null);
  }

  private _getFromCache<T>(cacheKey: string): Result<T> {
    let cacheExists = this.storageService.keyExists(cacheKey);
    if (!cacheExists.isSuccess) {
      let error = `Cache Key [${cacheKey!}] Exists : ${cacheExists.isSuccess}`;
      this.logger.warn(error);
      return new Result<T>(null, [error]);
    }

    var cachedResponse = this.storageService.getData<T>(cacheKey);
    if (!cachedResponse.isSuccess) {
      let error = `Cached Data For Cache Key [${cacheKey}] Exists : ${(cachedResponse.isSuccess)}`;
      this.logger.warn(error);
      return new Result<T>(null, [error]);
    }

    return cachedResponse;
  }

  private _updateAllowanceEntity(property: 'getStatus' | 'getAreaInformation' | 'getAreasNearby' | 'getArea' | 'getTopicsNearby'): Observable<ResultBase> {
    let cacheKey = StorageServiceKeyConstants.USER_DATA_ALLOWANCE;
    let cachedResult = this._getFromCache<AllowanceEntity>(cacheKey);
    if (!cachedResult.isSuccess) {
      return of(new ResultBase(cachedResult.errors));
    }

    let allowance = cachedResult.data!;
    allowance!.apiUtilizationBreakdown[property] += 1;

    let saveResult = this.storageService.updateExistingData(cacheKey, allowance);
    if (!saveResult.isSuccess) {
      let error = `Something went wrong while trying to save dbSet Value : [${saveResult.errors}]`;
      this.logger.warn(error);
      return of(new ResultBase([error]));
    }

    return of(saveResult);
  }

}
