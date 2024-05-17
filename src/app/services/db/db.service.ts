import { Injectable } from "@angular/core";
import { IEskomSePushApiService } from "../../core/contracts/services/eskom-se-push-api.service";
import { BehaviorSubject, Observable, map, of, switchMap, tap } from "rxjs";
import { AreaSearchEntity } from "../../core/models/entities/area-search-entity";
import { DbResult } from "../../core/models/response-types/db-result";
import { StatusEntity } from "../../core/models/entities/status-entity";
import { AreaInfoEntity } from "../../core/models/entities/area-info-entity";
import { AreasNearbyEntity } from "../../core/models/entities/areas-nearby-entity";
import { TopicsNearbyEntity } from "../../core/models/entities/topics-nearby-entity";
import { AllowanceEntity } from "../../core/models/entities/allowance-entity";
import { EskomSePushApiService } from "../http/eskom-se-push-api.service";
import { EskomSePushMockApiService } from "../http/eskom-se-push-mock-api.service";
import { SessionStorageService } from "../storage/session-storage.service";
import { EskomSePushEntityMapperService } from "../mappers/eskom-se-push-entity-mapper.service";
import { NGXLogger } from "ngx-logger";
import { environment } from "../../../environments/environment";
import { StorageServiceKeyConstants } from "../../core/constants/storage-service-key.constants";
import { EskomSePushConfig } from "../../core/models/common/Settings/user-app-settings";
import { IteratableDbResult } from "../../core/models/response-types/iteratable-db-results";
import { ApiUtilizationBreakdown } from "../../core/models/common/allowance/api-utilization-breakdown";

export type dbSetOpperation = 'set' | 'update' | 'delete' | 'append';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  //#region "STORE SERVICES"

  private _apiService: IEskomSePushApiService;

  //#endregion "STORE SERVICES"

  //#region "STORE ENTITIES"

  //USER MANAGED - SINGLE ENTITIES
  private _useCache: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private _savedAreas: BehaviorSubject<AreaSearchEntity | null> = new BehaviorSubject<AreaSearchEntity | null>(null);
  private _userSettings: BehaviorSubject<EskomSePushConfig | null> = new BehaviorSubject<EskomSePushConfig | null>(null);

  //API MANAGED - SINGLE ENTITIES
  private _status: BehaviorSubject<StatusEntity | null> = new BehaviorSubject<StatusEntity | null>(null);
  private _areasNearby: BehaviorSubject<AreasNearbyEntity | null> = new BehaviorSubject<AreasNearbyEntity | null>(null);
  private _topicsNearby: BehaviorSubject<TopicsNearbyEntity | null> = new BehaviorSubject<TopicsNearbyEntity | null>(null);
  private _allowance: BehaviorSubject<AllowanceEntity | null> = new BehaviorSubject<AllowanceEntity | null>(null);

  //API MANAGED - MULTIPLE ENTITIES
  private _areas: BehaviorSubject<AreaSearchEntity[]> = new BehaviorSubject<AreaSearchEntity[]>([]);
  private _areasInformation: BehaviorSubject<AreaInfoEntity[]> = new BehaviorSubject<AreaInfoEntity[]>([]);

  //#endregion "STORE ENTITIES"

  constructor(
    private apiService: EskomSePushApiService,
    private mockApiService: EskomSePushMockApiService,
    private storageService: SessionStorageService,
    private mapper: EskomSePushEntityMapperService,
    private logger: NGXLogger
  ) {
    this._apiService = environment.useMockData ? mockApiService : apiService;
    this.logger.info(`Using Mock Http Service : ${environment.useMockData}`);
  }

  //#region "GET ENTITIES"

  public get getSavedAreas(): Observable<DbResult<AreaSearchEntity>> {
    return this._returnDbSet(this._savedAreas);
  }

  public get getStatus(): Observable<DbResult<StatusEntity>> {
    return this._returnDbSet(this._status);
  }

  public get getAreasInformation(): Observable<IteratableDbResult<AreaInfoEntity>> {
    return this._returnIteratableDbSet(this._areasInformation);
  }

  public get getAreasNearby(): Observable<DbResult<AreasNearbyEntity>> {
    return this._returnDbSet(this._areasNearby);
  }

  public get getArea(): Observable<IteratableDbResult<AreaSearchEntity>> {
    return this._returnIteratableDbSet(this._areas);
  }

  public get getTopicsNearby(): Observable<DbResult<TopicsNearbyEntity>> {
    return this._returnDbSet(this._topicsNearby);
  }

  public get getAllowance(): Observable<DbResult<AllowanceEntity>> {
    return this._returnDbSet(this._allowance);
  }

  public get getCacheState(): Observable<boolean> {
    return this._useCache.asObservable();
  }

  public get getUserSettings(): Observable<DbResult<EskomSePushConfig>> {
    return this._returnDbSet(this._userSettings);
  }

  //#endregion "GET ENTITIES"

  //#region "UPDATE ENTITIES"

  public updateSavedAreas(areas: AreaSearchEntity): Observable<boolean> {
    return this._addOrUpdateDbSetCacheValue(
      'set',
      this._savedAreas,
      areas,
      StorageServiceKeyConstants.USER_DATA_SAVED_AREAS
    );
  }

  public updateUserSettings(settings: EskomSePushConfig): Observable<boolean> {
    return this._addOrUpdateDbSetCacheValue(
      'set',
      this._userSettings,
      settings,
      StorageServiceKeyConstants.USER_DATA_SETTINGS
    )
  }

  public updateAllowance(util: AllowanceEntity | null): Observable<boolean> {
    let operation: dbSetOpperation = 'set';

    //WE ARE NOT CHECKING CACHE HERE SINCE THE ALLOWANCE API DOES NOT COUNT TOWARDS API CALLS.
    return this._apiService.getAllowance().pipe(
      switchMap((value) => {
        if (value.isSuccess == false) {
          this.logger.warn(`${typeof (DbService)}: updateAllowance() failed to return a succesfull response. [${value.errors}]`);
          return of(false);
        }

        if (!util) {
          var cachedResponse = this.storageService.getData<AllowanceEntity>(StorageServiceKeyConstants.USER_DATA_ALLOWANCE);
          if (cachedResponse.isSuccess) {
            util = cachedResponse.data;
          }
        }

        let entityData = this.mapper.toAllowanceEntity(value.data!, util);

        return this._addOrUpdateDbSetCacheValue(operation,
          this._allowance,
          entityData,
          StorageServiceKeyConstants.USER_DATA_ALLOWANCE);
      })
    );
  }

  //TODO: CONTINUE WITH PERFECTING THE SYNC FUNCTION.
  public updateStatus(skipCache: boolean = false): Observable<boolean> {
    let dbSetOpperation: dbSetOpperation = 'set';

    let cacheEnabled: boolean = false;
    return this.getCacheState
      .pipe(
        switchMap((enabled) => {
          cacheEnabled = enabled
          if (enabled && skipCache == false) {
            return this.syncStatus();
          }
          return of(false);
        }),
        switchMap((cacheLoaded) => {
          if (cacheLoaded) {
            return of(cacheLoaded);
          }

          return this._apiService.getStatus()
            .pipe(
              switchMap((value) => {
                if (value.isSuccess == false) {
                  this.logger.warn(`${typeof (DbService)}: updateStatus() failed to return a succesfull response. [${value.errors}]`);
                  return of(false);
                }

                let entityData = this.mapper.toStatusEntity(value.data!);

                this.logger.info(`${typeof (DbService)}: updateStatus() returned a succesfull response. caching response based on settings: ${cacheEnabled}`);
                if (cacheEnabled) {
                  return this._addOrUpdateDbSetCacheValue(
                    dbSetOpperation,
                    this._status,
                    entityData,
                    StorageServiceKeyConstants.API_RESPONSE_GETSTATUS
                  );
                } else {
                  return this._setDbSetValue(dbSetOpperation, this._status, entityData);
                }
              }),
              switchMap(result => {
                if(result == false) return of(result);
                return this._updateAllowanceEntity('getStatus');
              })
            );
        })
      );
  }

  public updateTopicsNearby(lat: number, long: number, skipCache: boolean = false): Observable<boolean> {
    let dbSetOpperation: dbSetOpperation = 'set';

    let cacheEnabled: boolean = false;
    return this.getCacheState
      .pipe(
        switchMap((enabled) => {
          cacheEnabled = enabled;
          if (enabled && skipCache == false) {
            return this.syncTopicsNearby();
          }
          return of(false);
        }),
        switchMap(cacheLoaded => {
          if (cacheLoaded) {
            return of(cacheLoaded);
          }

          return this._apiService.getTopicsNearby(lat, long)
            .pipe(
              switchMap((value) => {
                if (value.isSuccess == false) {
                  this.logger.warn(`${typeof (DbService)}: updateTopicsNearby() failed to return a succesfull response. [${value.errors}]`);
                  return of(false);
                }

                let entityData = this.mapper.toTopicsNearbyEntity(value.data!);

                this.logger.info(`${typeof (DbService)}: updateTopicsNearby() returned a succesfull response. caching response based on settings: ${cacheEnabled}`);
                if (cacheEnabled) {
                  return this._addOrUpdateDbSetCacheValue(
                    dbSetOpperation,
                    this._topicsNearby,
                    entityData,
                    StorageServiceKeyConstants.API_RESPONSE_GETTOPICNEARBY
                  );
                } else {
                  return this._setDbSetValue(dbSetOpperation, this._topicsNearby, entityData);
                }
              }),
              switchMap(result => {
                if(result == false) return of(result);
                return this._updateAllowanceEntity('getTopicsNearby');
              })
            );
        }
        )
      );
  }

  public updateAreasNearby(lat: number, long: number, skipCache: boolean = false): Observable<boolean> {
    let dbSetOpperation: dbSetOpperation = 'set';

    let cacheEnabled: boolean = false;
    return this.getCacheState
      .pipe(
        switchMap((enabled) => {
          cacheEnabled = enabled;
          if (enabled && skipCache == false) {
            return this.syncAreasNearby();
          }
          return of(false);
        }),
        switchMap(cacheLoaded => {
          if (cacheLoaded) {
            return of(cacheLoaded);
          }

          return this._apiService.getAreasNearby(lat, long)
            .pipe(
              switchMap((value) => {
                if (value.isSuccess == false) {
                  this.logger.warn(`${typeof (DbService)}: updateAreasNearby() failed to return a succesfull response. [${value.errors}]`);
                  return of(false);
                }

                let entityData = this.mapper.toAreasNearbyEntity(value.data!);

                this.logger.info(`${typeof (DbService)}: updateAreasNearby() returned a succesfull response. caching response based on settings: ${cacheEnabled}`);
                if (cacheEnabled) {
                  return this._addOrUpdateDbSetCacheValue(
                    dbSetOpperation,
                    this._areasNearby,
                    entityData,
                    StorageServiceKeyConstants.API_RESPONSE_GETAREASNEARBY
                  );
                } else {
                  return this._setDbSetValue(dbSetOpperation, this._areasNearby, entityData);
                }
              }),
              switchMap(result => {
                //TODO: THIS DOES NOT HIT???????????????????????
                if(result == false) return of(result);
                return this._updateAllowanceEntity('getAreasNearby');
              })
            );
        }
        )
      );
  }

  //#endregion "UPDATE ENTITIES"

  //#region "ADD ENTITIES"

  public addAreaInformation(areaInfoId: string, skipCache: boolean = false): Observable<boolean> {
    let dbSetOpperation: dbSetOpperation = 'append';

    let cacheEnabled: boolean = false;
    return this.getCacheState
      .pipe(
        switchMap((enabled) => {
          cacheEnabled = enabled
          if (enabled && skipCache == false) {
            return this.syncAreaInformation();
          }
          return of(false);
        }),
        switchMap(cacheLoaded => {
          if (cacheLoaded) {
            return of(cacheLoaded);
          }

          return this._apiService.getAreaInformation(areaInfoId)
            .pipe(
              switchMap((value) => {
                if (value.isSuccess == false) {
                  this.logger.warn(`${typeof (DbService)}: addAreaInformation() failed to return a succesfull response. [${value.errors}]`);
                  return of(false);
                }

                let entityData = this.mapper.toAreaInfoEntity(value.data!, areaInfoId);

                this.logger.info(`${typeof (DbService)}: addAreaInformation() returned a succesfull response. caching response based on settings: ${cacheEnabled}`);
                if (cacheEnabled) {
                  return this._addOrUpdateDbSetCacheValue(
                    dbSetOpperation,
                    this._areasInformation,
                    entityData,
                    StorageServiceKeyConstants.API_RESPONSE_GETAREAINFO
                  );
                } else {
                  return this._setDbSetValue(dbSetOpperation, this._areasInformation, entityData);
                }
              }),
              switchMap(result => {
                if(result == false) return of(result);
                return this._updateAllowanceEntity('getAreaInformation');
              })
            );
        }
        )
      );
  }

  public addArea(areaName: string, skipCache: boolean = false): Observable<boolean> {
    let dbSetOpperation: dbSetOpperation = 'append'

    let cacheEnabled: boolean = false;
    return this.getCacheState
      .pipe(
        switchMap((enabled) => {
          cacheEnabled = enabled
          if (enabled && skipCache == false) {
            return this.syncAreas();
          }
          return of(false);
        }),
        switchMap(cacheLoaded => {
          if (cacheLoaded) {
            return of(cacheLoaded);
          }

          return this._apiService.getArea(areaName)
            .pipe(
              switchMap((value) => {
                if (value.isSuccess == false) {
                  this.logger.warn(`${typeof (DbService)}: addArea() failed to return a succesfull response. [${value.errors}]`);
                  return of(false);
                }

                let entityData = this.mapper.toAreaSearchEntity(value.data!);

                this.logger.info(`${typeof (DbService)}: addArea() returned a succesfull response. caching response based on settings: ${cacheEnabled}`);
                if (cacheEnabled) {
                  return this._addOrUpdateDbSetCacheValue(
                    dbSetOpperation,
                    this._areas,
                    entityData,
                    StorageServiceKeyConstants.API_RESPONSE_GETAREA
                  );
                } else {
                  return this._setDbSetValue(dbSetOpperation, this._areas, entityData);
                }
              }),
              switchMap(result => {
                if(result == false) return of(result);
                return this._updateAllowanceEntity('getArea');
              })
            );
        }
        )
      );
  }

  //#endregion "ADD ENTITIES"

  //#region "MANAGE DB STATE"

  public reset() {
    this._useCache.next(true);
    this._savedAreas.next(null);
    this._status.next(null);
    this._areasInformation.next([]);
    this._areasNearby.next(null);
    this._areas.next([]);
    this._topicsNearby.next(null);
    this._allowance.next(null);
    this._userSettings.next(null);

    this.logger.info(`${typeof (DbService)}: Entities have been clear to default values.`);
  }

  public sync(): Observable<boolean> {
    return this.syncAllowance()
      .pipe(
        //STEP: SYNC STATUS, IF NOT FOUND, THEN LOAD IN
        switchMap((result) => {
          return this.syncStatus();
        }),
        switchMap((result) => {
          if (!result) {
            return this.updateStatus();
          }

          return of(result);
        }),
        //STEP: SYNC USER RELATED DATA
        switchMap((result) => {
          return this.syncSavedAreas();
        }),
        switchMap((result) => {
          return this.syncUserSettings();
        }),
        //STEP: SYNC DATA, IF NULL, SOMETHING ELSE WILL NEED TO LOAD IT IN.
        switchMap((result) => {
          return this.syncAreas();
        }),
        switchMap((result) => {
          return this.syncAreaInformation();
        }),
        switchMap((result) => {
          return this.syncAreasNearby();
        }),
        switchMap((result) => {
          return this.syncTopicsNearby();
        })

      );
  }

  //#endregion "MANAGE DB STATE"

  //#region "SYNC ENTITIES"

  public syncSavedAreas(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._savedAreas,
      StorageServiceKeyConstants.USER_DATA_SAVED_AREAS
    ).pipe(
      switchMap((result) => {
        if (!result) {
          return this._addOrUpdateDbSetCacheValue(
            'set',
            this._savedAreas,
            {
              areas: []
            },
            StorageServiceKeyConstants.USER_DATA_SAVED_AREAS
          )
        }

        return of(result);
      })
    );
  }

  public syncUserSettings(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._userSettings,
      StorageServiceKeyConstants.USER_DATA_SETTINGS
    );
  }

  public syncAllowance(): Observable<boolean> {
    return this.updateAllowance(null);
  }

  public syncStatus(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._status,
      StorageServiceKeyConstants.API_RESPONSE_GETSTATUS
    );
  }

  public syncTopicsNearby(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._topicsNearby,
      StorageServiceKeyConstants.API_RESPONSE_GETTOPICNEARBY
    );
  }

  public syncAreasNearby(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._areasNearby,
      StorageServiceKeyConstants.API_RESPONSE_GETAREASNEARBY
    );
  }

  public syncAreaInformation(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._areasInformation,
      StorageServiceKeyConstants.API_RESPONSE_GETAREAINFO
    );
  }

  public syncAreas(): Observable<boolean> {
    return this._attemptLoadDbSetFromCache(
      'set',
      this._areas,
      StorageServiceKeyConstants.API_RESPONSE_GETAREA
    );
  }

  //#endregion "SYNC ENTITIES"

  //#region "INTERNAL FUNCTIONS"

  private _updateAllowanceEntity(property: 'getStatus' | 'getAreaInformation' | 'getAreasNearby' | 'getArea' | 'getTopicsNearby'): Observable<boolean> {
    let allowance = this._allowance.value;
    if (allowance) {
      allowance!.apiUtilizationBreakdown[property] += 1;

      return this._addOrUpdateDbSetCacheValue('update',
        this._allowance,
        allowance,
        StorageServiceKeyConstants.USER_DATA_ALLOWANCE);
    }

    return of(false);
  }

  /***
   * Handler that will Map The Underlying Entity Subject too an Observable Result that can be consumed.
   * This Result can contain meta data about the Entity the caller is trying to consume.
   * @param entity Internal Entity Subject that will be returned.
   * @returns The internal Entity Subect Value.  
  */
  private _returnDbSet<TEntity>(entity: BehaviorSubject<TEntity | null>): Observable<DbResult<TEntity>> {
    return entity.asObservable()
      .pipe(
        map(entity => {
          let errors: string[] = [];
          if (entity == null) {
            let errorMsg = `Entity has not been initiallized yet.`;
            this.logger.warn(errorMsg);
            errors.push(errorMsg);
          }

          return new DbResult<TEntity>(entity, errors);
        }));
  }

  /***
   * Handler that will Map The Underlying Entity Subject too an Observable Result that can be consumed.
   * This Result can contain meta data about the Entity the caller is trying to consume.
   * @param entity Internal Entity Subject that will be returned.
   * @returns The internal Entity Subect Value.  
  */
  private _returnIteratableDbSet<TEntity>(entity: BehaviorSubject<TEntity[]>): Observable<IteratableDbResult<TEntity>> {
    return entity.asObservable()
      .pipe(
        map(entity => {
          let errors: string[] = [];

          if (entity == null) {
            let errorMsg = `${(typeof entity)} has not been initiallized yet.`;
            this.logger.warn(errorMsg);
            errors.push(errorMsg);
          }

          return new IteratableDbResult<TEntity>(entity, errors);
        }));
  }

  /**
   * Handler that will manipulate the internal Entity Subject.
   * @param dbSetOpperation 
   * @param dbSet 
   * @param dbSetValue 
   * @returns True if the opperation succedded, else false.
   */
  private _setDbSetValue(
    dbSetOpperation: dbSetOpperation,
    dbSet: BehaviorSubject<any>, //TODO: Change 'any' type to Generic TEntity, TEntity needs to be a itteratable type.
    dbSetValue: any //TODO: Change any type to Generic TEntity, TEntity needs to be a itteratable type.
  ): Observable<boolean> {
    try {
      if (dbSetOpperation == 'set' || dbSetOpperation == 'update') {
        dbSet.next(dbSetValue);
      } else if (dbSetOpperation == 'append') {
        let dbValue = Array.isArray(dbSet.value) ? dbSet.value : new Array(dbSet.value);
        dbValue.push(dbSetValue);
        dbSet.next(dbValue);
      } else if (dbSetOpperation == 'delete') {
        dbSet.next(null);
      }

      return of(true);
    } catch (error) {
      this.logger.error(`Setting DbSet [${typeof (dbSet)}], was not succesfull. Error : [${error}]`);
      return of(false);
    }
  }

  /**
   * Attempts to set the Internal DbSet Value from cache if it was set previously.
   * @param dbSetOpperation 
   * @param dbSet 
   * @param useCache 
   * @param cacheKey 
   * @returns Returns False if something went wrong or if the cache was not available, else True.
   */
  private _attemptLoadDbSetFromCache<DbSetType>(
    dbSetOpperation: dbSetOpperation,
    dbSet: BehaviorSubject<DbSetType>,
    cacheKey: string
  ): Observable<boolean> {
    let cacheExists = this.storageService.keyExists(cacheKey);
    if (!cacheExists.isSuccess) {
      this.logger.warn(`Cache Key [${cacheKey!}] Exists : ${cacheExists.isSuccess}`);
      return of(false);
    }

    var cachedResponse = this.storageService.getData<DbSetType>(cacheKey);
    if (!cachedResponse.isSuccess) {
      this.logger.warn(`Cached Data For Cache Key [${cacheKey}] Exists : ${(cachedResponse.isSuccess)}`);
      return of(false);
    }

    return this._setDbSetValue(dbSetOpperation, dbSet, cachedResponse.data);
  }

  /**
   * Adds / Updates the DbSet Value in cache.
   * @param dbSetOpperation 
   * @param dbSet 
   * @param dbSetValue 
   * @param cacheKey 
   * @returns True if the add / update was succesfull, else False.
   */
  private _addOrUpdateDbSetCacheValue<DbSetType, DbSetValueType>(
    dbSetOpperation: dbSetOpperation,
    dbSet: BehaviorSubject<DbSetType>,
    dbSetValue: DbSetValueType,
    cacheKey: string,
  ): Observable<boolean> {
    let dbValueExists = this.storageService.keyExists(cacheKey);

    //IF THE CACHE DOES NOT EXISTS, WE JUST NOTIFY SINCE A NEW VALUE CAN STILL BE SAVED.
    this.logger.info(`Cache Key [${cacheKey!}] Exists : ${dbValueExists.isSuccess}`);

    return this._setDbSetValue(dbSetOpperation, dbSet, dbSetValue)
      .pipe(
        map((result) => {
          if (result) {
            let saveResult = this.storageService.saveData(cacheKey, dbSet.value);
            if (!saveResult.isSuccess) {
              this.logger.warn(`Something went wrong while trying to save dbSet Value : [${saveResult.errors}]`);
              return false;
            }

            return true;
          }

          return result;
        })
      );
  }

  //#endregion "INTERNAL FUNCTIONS"

}