import { Division } from '../enums';

export enum InspectionType {
  ROUGH_INSPECTION = 'roughInspections',
  FINAL_INSPECTION = 'finalInspections',
  GREASE_DUCT_INSPECTION = 'greaseDuctInspections',
  PRE_HEALTH_INSPECTION = 'preHealthInspections',
  FINAL_BLDG_INSPECTION = 'finalBldgInspections',
  FIRE_DEPT_INSPECTION = 'fireDeptInspections',
  FINAL_HEALTH_INSPECTION = 'finalHealthInspections',
  TOTAL_INSPECTION = 'totalInspections'
}

export type Inspections = {
  [InspectionType.ROUGH_INSPECTION]: number;
  [InspectionType.FINAL_INSPECTION]: number;
  [InspectionType.GREASE_DUCT_INSPECTION]: number;
  [InspectionType.PRE_HEALTH_INSPECTION]: number;
  [InspectionType.FINAL_BLDG_INSPECTION]: number;
  [InspectionType.FIRE_DEPT_INSPECTION]: number;
  [InspectionType.FINAL_HEALTH_INSPECTION]: number;
  [InspectionType.TOTAL_INSPECTION]: number;
};

export type DivisionValue = {
  [Division.DIV_1]: number;
  [Division.DIV_2]: number;
  [Division.DIV_3_4]: number;
  [Division.DIV_5_7]: number;
  [Division.DIV_8]: number;
  [Division.DIV_9]: number;
  [Division.DIV_10]: number;
  [Division.DIV_11_12]: number;
  [Division.DIV_13]: number;
  [Division.DIV_15]: number;
  [Division.DIV_15_1]: number;
  [Division.DIV_16]: number;
};

export class ProjectEstimateDto {
  public divisions: DivisionValue;
  public profitMargin: number;
  public totalCost: number;
  public daysToComplete: number;
  public inspections: Inspections;
  public costPerSq: number;
}
