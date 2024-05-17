import { EskomStatusNextStage } from "./eskom-status-next-stage"

export interface EskomStatusLocation {
    name: string
    next_stages: EskomStatusNextStage[]
    stage: string
    stage_updated: string
}