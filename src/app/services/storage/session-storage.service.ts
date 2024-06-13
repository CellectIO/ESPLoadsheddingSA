import { Injectable } from '@angular/core';
import { ResultBase } from '../../core/models/response-types/result-base';
import { Result } from '../../core/models/response-types/result';
import { ScheduleService } from '../schedule/schedule.service';
import { CacheResult } from '../../core/models/response-types/cache-result';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  private readonly storage: Storage = window.localStorage;

  constructor(
    private scheduleService: ScheduleService
  ) { }

  /**
   * Save data to session storage
   * @param key target key used to idientify data being saved.
   * @param value target value to be saved associated with the key.
   * @returns ResultBase with details about the save process.
   */
  saveData<T>(key: string, value: T, canExpire: boolean): ResultBase {
    let stringyData = JSON.stringify(value);
    if(!stringyData){
      return new ResultBase([`Parsing value for key [${key}] resulted in empty content.`]);
    }

    let cacheDate = this.scheduleService.currentDate;
    let cacheResult = new CacheResult(value, cacheDate, canExpire);
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
    if(!data){
      return new Result<T>(null, [`No data found for specified key [${key}]`]);
    }

    let cacheResult = JSON.parse(data) as CacheResult<T>;
    if(this.isEpiredCache(cacheResult, key)){
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
      if(result != null)
      {
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
    if(!data){
      return new ResultBase(['Cached Data does not exists']);
    }

    let cacheResult = JSON.parse(data) as CacheResult<any>;
    if(this.isEpiredCache(cacheResult, key)){
      return new ResultBase([`Cached Data for specified key [${key}] has expired`]);
    }

    return new ResultBase(null);
  }

  /**
   * Removes all key/value pairs that are requested by the cacheKeys param
   */
  clear(cachekeys: string[]): ResultBase
  {
    var failedKeys: string[] = [];
    cachekeys.forEach(key => {
      let deleteResult = this.deleteData(key);
      if(!deleteResult.isSuccess){
        failedKeys.push(key);
      }
    });

    return failedKeys.length > 0 ?
      new ResultBase([`The Following Cache Keys failed to save: [${cachekeys}]`]) :
      new ResultBase(null);
  }

  private isEpiredCache<T>(cache: CacheResult<T>, cacheKey: string): boolean {
    if(cache.validateCache == false){
      return false;
    }

    const SIX_HOURS_IN_MILLISECONDS = 6 * 60 * 60 * 1000; // 6 Hours
    const THIRTY_SECONDS_IN_MILLISECONDS = 30 * 1000; // 30 seconds in milliseconds

    const currentTime = new Date().getTime();
    const givenTime = new Date(cache.created).getTime();
    
    let isExpired = (currentTime - givenTime) > THIRTY_SECONDS_IN_MILLISECONDS;
    if(isExpired){
      console.error('cache expired');
      this.deleteData(cacheKey);
    }

    return isExpired;
  }

}
