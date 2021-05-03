export enum ProjectType {
  RETAIL = 0,
  RESTAURANT,
  OFFICE_SPACE,
  MEDICAL_CLINIC,
  GYM_FITNESS_CENTER
}

export enum Region {
  NORTHERN_CALIFORNIA = 0,
  CENTRAL_CALIFORNIA,
  SOUTHERN_CALIFORNIA
}

export enum BusinessType {
  OWNER = 0,
  GENCON,
  SUBCON
}

export const BusinessTypeDescription = {
  [BusinessType.OWNER]: 'Owner',
  [BusinessType.GENCON]: 'General Contractor',
  [BusinessType.SUBCON]: 'Sub-Contractor'
};

export enum AccountType {
  COMPANY = 0,
  GENCON,
  SUBCON
}

export enum BillingStatus {
  INACTIVE = 0,
  ACTIVE,
  NON_RENEWING,
  EXPIRED
}

/** Used by Will Upload plans and toggle Download */
export enum PlansUploaded {
  NO_UPLOAD = 0,
  WILL_UPLOAD,
  UPLOADED
}

/** Used by MEP UI */
export enum AMEPSheetsUpload {
  DONT_KNOW = 0,
  NO,
  YES
}

export enum SubcontractorCategory {
  FRAME_DRYWALL = 0,
  ELECTRICAL,
  MECHANICAL_HVAC,
  PLUMBING
}
export const SubcontractorCategoryDescription = {
  [SubcontractorCategory.FRAME_DRYWALL]: 'Frame Drywall',
  [SubcontractorCategory.ELECTRICAL]: 'Electrical',
  [SubcontractorCategory.MECHANICAL_HVAC]: 'Mechanical HVAC',
  [SubcontractorCategory.PLUMBING]: 'Plumbing'
};

export enum SubscriptionStatus {
  INACTIVE = 0,
  ACTIVE,
  EXPIRED,
  NON_RENEWING // same as active but will end
}

export enum BidPricingSelection {
  NONE = 0,
  LOW,
  MEDIUM,
  HIGH
}
