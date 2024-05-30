import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class NgStyleService {

  constructor(private logger: NGXLogger) { }

  getStageColor(stage: number | string): string {
    let parsedInt = parseInt(stage.toString());
    this._validateStage(parsedInt);
    
    switch (parsedInt) {
      case 0:
        return 'stage0-color';
      case 1:
        return 'stage1-color';
      case 2:
        return 'stage2-color';
      case 3:
        return 'stage3-color';
      case 4:
        return 'stage4-color';
      case 5:
        return 'stage5-color';
      default:
        return 'stage6-color';
    }
  }

  getStageBgColor(stage: number | string): string {
    let parsedInt = parseInt(stage.toString());
    this._validateStage(parsedInt);

    switch (parsedInt) {
      case 0:
        return 'stage0-bg-color';
      case 1:
        return 'stage1-bg-color';
      case 2:
        return 'stage2-bg-color';
      case 3:
        return 'stage3-bg-color';
      case 4:
        return 'stage4-bg-color';
      case 5:
        return 'stage5-bg-color';
      default:
        return 'stage6-bg-color';
    }
  }

  _validateStage(stage: number){
    if(!([0,1,2,3,4,5,6,7,8].indexOf(stage) >= -1)){
      this.logger.error(`Provided Stage [${stage}] is not a valid stage`);
    }
  }

}
