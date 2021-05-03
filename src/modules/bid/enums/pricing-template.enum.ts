import { InspectionType } from '../dtos';
import { BidPricingSelection, BusinessType, ProjectType } from './bid.enum';
import { FinishesType } from './project-details.enum';

export const ProjectTypeDescription = {
  [ProjectType.RETAIL]: 'Retail',
  [ProjectType.RESTAURANT]: 'Restaurant',
  [ProjectType.OFFICE_SPACE]: 'Office Space',
  [ProjectType.MEDICAL_CLINIC]: 'Medical / Clinic',
  [ProjectType.GYM_FITNESS_CENTER]: 'Gym/ Fitness center'
};

export const FinishesDescription = {
  [FinishesType.BASIC]: 'Basic Finish',
  [FinishesType.MEDIUM]: 'Medium Finish',
  [FinishesType.HIGHEND]: 'Highend Finish'
};

export const InspectionDescriptions: { [key in InspectionType]?: string } = Object.freeze({
  [InspectionType.ROUGH_INSPECTION]: 'Rough Inspections',
  [InspectionType.FINAL_INSPECTION]: 'Final Inspections',
  [InspectionType.GREASE_DUCT_INSPECTION]: 'Grease Duct Inspection',
  [InspectionType.PRE_HEALTH_INSPECTION]: 'Pre-health Inspection (grease trap)',
  [InspectionType.FIRE_DEPT_INSPECTION]: 'Inspection from Fire Department',
  [InspectionType.FINAL_BLDG_INSPECTION]: 'Final Building',
  [InspectionType.FINAL_HEALTH_INSPECTION]: 'Final Health Inspection'
});

export enum EstimateKeys {
  PROFIT_MARGIN = 'profitMargin',
  TOTAL_COST = 'totalCost',
  DAYS_TO_COMPLETE = 'daysToComplete',
  COST_PER_SQ = 'costPerSq',
  TOTAL_INSPECTIONS = 'totalInspections'
}

export const EstimateTemplateCell: { [key in EstimateKeys]?: string } = {
  [EstimateKeys.PROFIT_MARGIN]: 'D17',
  [EstimateKeys.TOTAL_COST]: 'D19',
  [EstimateKeys.COST_PER_SQ]: 'D21',
  [EstimateKeys.DAYS_TO_COMPLETE]: 'D26',
  [EstimateKeys.TOTAL_INSPECTIONS]: 'D29'
};
