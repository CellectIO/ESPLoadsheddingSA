import { EskomStatusLocation } from "../common/status/eskom-status-location";
import { EskomStatusLocations } from "../common/status/eskom-status-locations";

export interface StatusEntity {
  status: StatusLocationsEntity
}

export interface StatusLocationsEntity extends EskomStatusLocations{
  _all: EskomStatusLocation[];
}