import { Observable } from "rxjs";
import { Result } from "../../models/response-types/result";
import { ESPStatusApiResponse } from "../../models/api-responses/eskom-se-push/esp-status-api-response";
import { ESPAreaInfoApiResponse } from "../../models/api-responses/eskom-se-push/esp-area-info-api-response";
import { ESPAreasNearbyApiResponse } from "../../models/api-responses/eskom-se-push/esp-areas-nearby-api-response";
import { ESPAreaSearchApiResponse } from "../../models/api-responses/eskom-se-push/esp-area-search-api-response";
import { ESPTopicsNearbyApiResponse } from "../../models/api-responses/eskom-se-push/esp-topics-nearby-api-response";
import { ESPAllowanceApiResponse } from "../../models/api-responses/eskom-se-push/esp-allowance-api-response";

export interface IEskomSePushApiService{

  /**
   * Gets the current overal status of loadshedding.
   */
  getStatus(): Observable<Result<ESPStatusApiResponse>>;

  /**
   * Gets loadshedding Information about a specific area.
   * @param areaId Target area identifier.
   */
  getAreaInformation(areaId: string): Observable<Result<ESPAreaInfoApiResponse>>;

  /**
   * Gets nearby areas based on the geographics provided in the parameters.
   * @param lat user latetude.
   * @param long user longetude.
   */
  getAreasNearby(lat: number, long:number): Observable<Result<ESPAreasNearbyApiResponse>>;

  /**
   * Gets Areas that partially match the area name provided in the parameter.
   * @param areaName name of the area.
   */
  getArea(areaName: string): Observable<Result<ESPAreaSearchApiResponse>>;

  /**
   * Gets Topics for the serounding geographic location provided in the parameters.
   * @param lat user latetude.
   * @param long user longetude.
   */
  getTopicsNearby(lat: number, long:number): Observable<Result<ESPTopicsNearbyApiResponse>>

  /**
   * Gets the users current allowance, this determines how many API calls has been made and how many are remaining depending on the users api subscription.
   */
  getAllowance(): Observable<Result<ESPAllowanceApiResponse>>;

  /**
   * Since the Allowance API does not count towards your Allowance Count, we are using it to determine if the API Key is valid.
   * This same API can be used to determine if users are abusing the free acounts policy
   * @param apiKey 
   */
  validateApiKey(apiKey: string): Observable<Result<ESPError>>;

}