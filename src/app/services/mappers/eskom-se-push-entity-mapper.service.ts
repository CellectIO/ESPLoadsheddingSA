import { Injectable } from '@angular/core';
import { ESPStatusApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-status-api-response';
import { StatusEntity } from '../../core/models/entities/status-entity';
import { ESPAreaInfoApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-info-api-response';
import { ESPAreasNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-areas-nearby-api-response';
import { AreasNearbyEntity } from '../../core/models/entities/areas-nearby-entity';
import { AreaSearchEntity } from '../../core/models/entities/area-search-entity';
import { ESPTopicsNearbyApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-topics-nearby-api-response';
import { TopicsNearbyEntity } from '../../core/models/entities/topics-nearby-entity';
import { ESPAllowanceApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-allowance-api-response';
import { AllowanceEntity } from '../../core/models/entities/allowance-entity';
import { ESPAreaSearchApiResponse } from '../../core/models/api-responses/eskom-se-push/esp-area-search-api-response';
import { AreaInfoDayEntity, AreaInfoEntity } from '../../core/models/entities/area-info-entity';
import { ApiUtilizationBreakdown } from '../../core/models/common/allowance/api-utilization-breakdown';

@Injectable({
  providedIn: 'root'
})
export class EskomSePushEntityMapperService {

  constructor() { }

  public toStatusEntity(data: ESPStatusApiResponse): StatusEntity {
    let all = [data?.status.eskom!, data?.status.capetown!];

    let response: StatusEntity = {
      status: {
        capetown: data?.status.capetown!,
        eskom: data?.status.eskom!,
        _all: all
      }
    }

    return response;
  }

  public toAreaInfoEntity(data: ESPAreaInfoApiResponse, areaInfoId: string): AreaInfoEntity {
    let schedules = data?.schedule.days.map(day => {
      let dayResponse: AreaInfoDayEntity = {
        date: day.date,
        name: day.name,
        stages: day.stages,
        _stages: day.stages.map((stage, index) => {
          let stageNumber = index + 1;
          return {
            name: `Stage ${stageNumber}`,
            stage: stageNumber,
            timeSlots: stage
          }
        })
      };

      return dayResponse;
    });

    let response: AreaInfoEntity = {
      areaInfoId: areaInfoId,
      events: data.events,
      info: data.info,
      schedule: {
        days: schedules,
        source: data.schedule.source
      }
    }

    return response;
  }

  public toAreasNearbyEntity(data: ESPAreasNearbyApiResponse, lat: number, long: number): AreasNearbyEntity {
    let response: AreasNearbyEntity = {
      areas: data.areas,
      lat: lat,
      long: long
    };

    return response;
  }

  public toAreaSearchEntity(data: ESPAreaSearchApiResponse): AreaSearchEntity {
    let response: AreaSearchEntity = {
      areas: data.areas
    };

    return response;
  }

  public toTopicsNearbyEntity(data: ESPTopicsNearbyApiResponse): TopicsNearbyEntity {
    let response: TopicsNearbyEntity = {
      topics: data.topics
    };

    return response;
  }

  public toAllowanceEntity(data: ESPAllowanceApiResponse, breakDown: ApiUtilizationBreakdown | null): AllowanceEntity {
    let response: AllowanceEntity = {
      allowance: data.allowance,
      apiUtilizationBreakdown: {
        getStatus: breakDown ? breakDown.getStatus : 0,
        getAreaInformation: breakDown ? breakDown.getAreaInformation : 0,
        getAreasNearby: breakDown ? breakDown.getAreasNearby : 0,
        getArea: breakDown ? breakDown.getArea : 0,
        getTopicsNearby: breakDown ? breakDown.getTopicsNearby : 0,
      }
    };

    return response;
  }

}
