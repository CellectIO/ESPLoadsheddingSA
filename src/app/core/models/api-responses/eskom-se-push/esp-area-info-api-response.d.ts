import { EskomAreaInfo } from "../../common/areas/eksom-area-info"
import { EskomAreaInfoEvent } from "../../common/areas/eskom-area-info-event"
import { EskomAreaInfoSchedule } from "../../common/areas/eskom-area-info-schedule"

export interface ESPAreaInfoApiResponse {
  events: EskomAreaInfoEvent[]
  info: EskomAreaInfo
  schedule: EskomAreaInfoSchedule
}