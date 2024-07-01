import { Injectable } from '@angular/core';
import { ResultBase } from '../../core/models/response-types/result-base';
import { Result } from '../../core/models/response-types/result';
import { CacheResult } from '../../core/models/response-types/cache-result';
import { NGXLogger } from 'ngx-logger';
import { StorageServiceKeyConstants } from '../../core/constants/storage-service-key.constants';
import { EskomSePushConfig } from '../../core/models/common/Settings/user-app-settings';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  private readonly storage: Storage = window.localStorage;

  constructor(
    private logger: NGXLogger
  ) { }

  /**
   * Save data to session storage
   * @param key target key used to idientify data being saved.
   * @param value target value to be saved associated with the key.
   * @returns ResultBase with details about the save process.
   */
  saveData<T>(key: string, value: T, canExpire: boolean, overrideExpiresInMinutes: number | null): ResultBase {
    let validStringyData = this.isStringyDataValid(key, value);
    if (!validStringyData.isSuccess) {
      return validStringyData;
    }

    //DETERMINE HOW LONG THE CACHE SHOULD BE VALID FOR BASED ON SETTINGS, DEFAULT OR OVERRIDE PARAMETER.
    let expireInMinutes = environment.cache.defaultExpiresInMinutes;
    if (overrideExpiresInMinutes == null) {
      let settingsCacheKey = StorageServiceKeyConstants.USER_DATA_SETTINGS;
      let cachedResult = this.getData<EskomSePushConfig>(settingsCacheKey);
      if (cachedResult.isSuccess) {
        expireInMinutes = cachedResult.data!.apiSyncInterval;
      }
    } else {
      expireInMinutes = overrideExpiresInMinutes;
    }

    let cacheDate = new Date();
    let cacheResult = new CacheResult(value, cacheDate, canExpire, expireInMinutes);
    let stringyCacheResult = JSON.stringify(cacheResult);

    this.storage.setItem(key, stringyCacheResult);
    return new ResultBase(null);
  }

  updateExistingData<T>(key: string, value: T): ResultBase {
    let validStringyData = this.isStringyDataValid(key, value);
    if (!validStringyData.isSuccess) {
      return validStringyData;
    }

    let keyExistsResult = this.keyExists(key);
    if(!keyExistsResult.isSuccess){
      return new ResultBase(keyExistsResult.errors);
    }

    const data = this.storage.getItem(key);
    if (!data) {
      return new ResultBase([`No data found for specified key [${key}]`]);
    }

    let cacheResult = JSON.parse(data) as CacheResult<T>;
    if (this.isEpiredCache(cacheResult, key)) {
      return new ResultBase([`Cached Data for specified key [${key}] has expired`]);
    }

    //ONCE ALL THE VALIDATION HAS PASSED UPDATE THE CACHE DATA BUT DO NOT RESET THE EXPIRE TIME.
    cacheResult.data = value;

    let stringyCacheResult = JSON.stringify(cacheResult);
    this.storage.setItem(key, stringyCacheResult);
    return new ResultBase(null);
  }

  /**
   * Get data from session storage for a specified key.
   * @param key target key used to idientify data being saved.
   * @returns Result with details about the save process.
   */
  getData<T>(key: string): Result<T> {
    const data = this.storage.getItem(key);
    if (!data) {
      return new Result<T>(null, [`No data found for specified key [${key}]`]);
    }

    let cacheResult = JSON.parse(data) as CacheResult<T>;
    if (this.isEpiredCache(cacheResult, key)) {
      return new Result<T>(null, [`Cached Data for specified key [${key}] has expired`]);
    }

    return new Result<T>(cacheResult.data, null);
  }

  /**
   * Delete data from session storage
   * @param key target key used to idientify what data to delete.
   */
  deleteData(key: string): ResultBase {
    this.storage.removeItem(key);
    return new ResultBase(null);
  }

  /**
   * Get all keys from session storage
   * @returns list of saved keys.
   */
  getAllKeys(): Result<string[]> {
    const keys: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      let result = this.storage.key(i);
      if (result != null) {
        keys.push();
      }
    }
    return new Result<string[]>(keys, null);
  }

  /**
   * Determines if a Key Exists in session storage.
   * @param key target key used to idientify data saved.
   * @returns 
   */
  keyExists(key: string): ResultBase {
    const data = this.storage.getItem(key);
    if (!data) {
      return new ResultBase(['Cached Data does not exists']);
    }

    let cacheResult = JSON.parse(data) as CacheResult<any>;
    if (this.isEpiredCache(cacheResult, key)) {
      return new ResultBase([`Cached Data for specified key [${key}] has expired`]);
    }

    return new ResultBase(null);
  }

  /**
   * Removes all key/value pairs that are requested by the cacheKeys param
   */
  clear(cachekeys: string[]): ResultBase {
    var failedKeys: string[] = [];
    cachekeys.forEach(key => {
      let deleteResult = this.deleteData(key);
      if (!deleteResult.isSuccess) {
        failedKeys.push(key);
      }
    });

    return failedKeys.length > 0 ?
      new ResultBase([`The Following Cache Keys failed to save: [${cachekeys}]`]) :
      new ResultBase(null);
  }

  private isEpiredCache<T>(cache: CacheResult<T>, cacheKey: string): boolean {
    //IF THE CACHE SHOULD NOT BE VALIDATED, JUST ACT LIKE ITS STILL VALID.
    if (cache.validateCache == false) {
      return false;
    }

    //BASED ON THE CURRENT TIME AND THE CACHE TIME, DETERMINE IF THE CACHE SHOULD BE DELETED.
    let currentDate = new Date();
    let givenDate = new Date(cache.created);
    const minutesOffset = 1;
    const utcMinutesDiff = currentDate.getUTCMinutes() - givenDate.getUTCMinutes();

    let isExpired = utcMinutesDiff > (cache.expiresInMinutes - minutesOffset);
    if (isExpired) {
      this.logger.warn(`Cache has expired for Cache Key: ${cacheKey} with current time [${currentDate}] and cache key time [${givenDate}]`);
      this.deleteData(cacheKey);
    }

    return isExpired;
  }

  private isStringyDataValid<T>(key: string, value: T): ResultBase {
    let stringyData = JSON.stringify(value);
    if (!stringyData) {
      return new ResultBase([`Parsing value for key [${key}] resulted in empty content.`]);
    }

    return new ResultBase(null);
  }

}
