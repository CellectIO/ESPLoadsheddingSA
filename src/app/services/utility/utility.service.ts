import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }

  /**
   * IF THIS LOOKS DUMB, ITS BECAUSE IT IS
   * DUE TO ARRAY's BEING REFERENCE TYPES, IF I MODIFY THE ARRAY CONTENT LIKE I DO BELOW IT WILL RESULT IN THE ORIGINAL ARRAY TO BE MODIFIED ASWELL.
   * SO I AM PARSING IT TO JSON AND BACK INTO THE ORIGINAL TYPE
   * TO MAKE THE COMPILER THINK ITS A BRAND NEW ARRAY AND BREAKING THE REFERENCE ISSUE.
   * @param array 
   * @returns 
   */
  newArray<T>(array: T[]): T[]{
    let stringyData = JSON.stringify(array);
    let newArray = JSON.parse(stringyData) as T[];
    return newArray;
  }

}
