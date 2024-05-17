import { ApiUtilizationBreakdown } from "../common/allowance/api-utilization-breakdown";
import { EskomAllowance } from "../common/allowance/eskom-allowance";

export interface AllowanceEntity {
  allowance: EskomAllowance
  apiUtilizationBreakdown: ApiUtilizationBreakdown
}