import { EskomAreaInfo } from "../common/areas/eksom-area-info"
import { EskomAreaInfoDay } from "../common/areas/eskom-area-info-day"
import { EskomAreaInfoEvent } from "../common/areas/eskom-area-info-event"
import { EskomAreaInfoStage } from "../common/areas/eskom-area-info-stage"

export interface AreaInfoEntity {
  areaInfoId: string
  events: EskomAreaInfoEvent[]
  info: EskomAreaInfo
  schedule: AreaInfoScheduleEntity
}

export interface AreaInfoScheduleEntity {
  days: AreaInfoDayEntity[]
  source: string
}

export interface AreaInfoDayEntity extends EskomAreaInfoDay {
  //Custom Property that needs to be set manually.
  _stages: EskomAreaInfoStage[]
}
