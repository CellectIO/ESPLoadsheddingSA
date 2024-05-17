import { Injectable } from '@angular/core';
import { ResultBase } from '../../core/models/response-types/result-base';
import { Result } from '../../core/models/response-types/result';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  private readonly storage: Storage = window.localStorage;

  constructor() { }

  /**
   * Save data to session storage
   * @param key target key used to idientify data being saved.
   * @param value target value to be saved associated with the key.
   * @returns ResultBase with details about the save process.
   */
  saveData<T>(key: string, value: T): ResultBase {
    let stringyData = JSON.stringify(value);
    if(!stringyData){
      return new ResultBase([`Parsing value for key [${key}] resulted in empty content.`]);
    }

    this.storage.setItem(key, stringyData);
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

    return new Result<T>(JSON.parse(data), null);
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
  keyExists(key: string): Result<boolean> {
    const data = this.storage.getItem(key);

    return !data?
      new Result<boolean>(false, null):
      new Result<boolean>(true, null);
  }

  /**
   * Removes all key/value pairs, if there are any.
   */
  clear(){
    this.storage.clear();
  }

}
