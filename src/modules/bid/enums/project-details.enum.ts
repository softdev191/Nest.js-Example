export enum Workscope {
  GROUND_UP = 0,
  TENANT_IMPROVEMENT
}

export enum ConstructionType {
  NEW_SHELL = 0,
  RENOVATION_WITH_DEMOLITION
}

export enum BuildingType {
  INSIDE_MALL = 0,
  STRIP_CENTER,
  STANDALONE_BLDG,
  HIGHRISE
}

export enum FloorLevel {
  FIRST_FLOOR = 0,
  SECOND_FLOOR,
  THIRD_OR_HIGHER
}
export const FloorLevelFactor = {
  [FloorLevel.FIRST_FLOOR]: 1.3,
  [FloorLevel.SECOND_FLOOR]: 1.35,
  [FloorLevel.THIRD_OR_HIGHER]: 1.4
};

export enum StoreInfoType {
  EXISTING = 'existing',
  NEW = 'new'
}

export enum AcHvacUnits {
  EXISTING = 'existing',
  NEW = 'new'
}

export enum FinishesType {
  BASIC = 0,
  MEDIUM,
  HIGHEND
}
