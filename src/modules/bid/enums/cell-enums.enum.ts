import { Division } from './division.enum';
import { ProjectType } from './bid.enum';
import { SquareFeetCalendarRange, SquareFeetRange } from './square-feet-range.enum';
import { Inspections, InspectionType } from '../dtos';

export const CellAreaColumn: { [key in ProjectType]?: string } = {
  [ProjectType.RETAIL]: 'B',
  [ProjectType.RESTAURANT]: 'C',
  [ProjectType.OFFICE_SPACE]: 'D',
  [ProjectType.MEDICAL_CLINIC]: 'E',
  [ProjectType.GYM_FITNESS_CENTER]: 'F'
};

export const CellAreaRow: { [key in ProjectType]?: number } = {
  [ProjectType.RETAIL]: 2,
  [ProjectType.RESTAURANT]: 3,
  [ProjectType.OFFICE_SPACE]: 4,
  [ProjectType.MEDICAL_CLINIC]: 5,
  [ProjectType.GYM_FITNESS_CENTER]: 6
};

export const CellDivRow: { [key in Division]?: number } = {
  [Division.DIV_1]: 2,
  [Division.DIV_2]: 3,
  [Division.DIV_3_4]: 4,
  [Division.DIV_5_7]: 5,
  [Division.DIV_8]: 6,
  [Division.DIV_9]: 7,
  [Division.DIV_10]: 8,
  [Division.DIV_11_12]: 9,
  [Division.DIV_13]: 10,
  [Division.DIV_15]: 11,
  [Division.DIV_15_1]: 12,
  [Division.DIV_16]: 13
};

export const CellSqFtColumn = {
  [SquareFeetRange._700]: 'B',
  [SquareFeetRange._900]: 'C',
  [SquareFeetRange._1100]: 'D',
  [SquareFeetRange._1300]: 'E',
  [SquareFeetRange._1500]: 'F',
  [SquareFeetRange._2000]: 'G',
  [SquareFeetRange._2500]: 'H',
  [SquareFeetRange._3000]: 'I',
  [SquareFeetRange._3500]: 'J',
  [SquareFeetRange._4000]: 'K',
  [SquareFeetRange._4500]: 'L'
};

export const CellCalendarSqFtColumn = {
  [SquareFeetCalendarRange._500]: 'B',
  [SquareFeetCalendarRange._1000]: 'C',
  [SquareFeetCalendarRange._2000]: 'D',
  [SquareFeetCalendarRange._3500]: 'E',
  [SquareFeetCalendarRange._5000]: 'F'
};

export enum InspectionBreakdownCell {
  _5 = 'B',
  _7 = 'C',
  _9 = 'D',
  _9_M = 'E',
  _9_P = 'F',
  _11 = 'G',
  _11_ME = 'H',
  _11_EP = 'I',
  _13 = 'J',
  _15 = 'K'
}

export const CellInspectionRow: { [key in InspectionType]?: number } = {
  [InspectionType.ROUGH_INSPECTION]: 2,
  [InspectionType.FINAL_INSPECTION]: 3,
  [InspectionType.GREASE_DUCT_INSPECTION]: 4,
  [InspectionType.PRE_HEALTH_INSPECTION]: 5,
  [InspectionType.FINAL_BLDG_INSPECTION]: 6,
  [InspectionType.FIRE_DEPT_INSPECTION]: 7,
  [InspectionType.FINAL_HEALTH_INSPECTION]: 8
};

export enum WorkingDaysCalendar {
  WORKING_DAYS = 0,
  WEEKENDS,
  OFF_HOUR_WORKING_DAYS
}
