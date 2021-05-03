import { Plans } from '../entities';
import { AMEPSheetsUpload } from '../enums';

export class ProjectPlanResponseDto {
  public plans: Plans[];
  public amepPlan: AMEPSheetsUpload;
  public mPlan: AMEPSheetsUpload;
  public ePlan: AMEPSheetsUpload;
  public pPlan: AMEPSheetsUpload;
}
