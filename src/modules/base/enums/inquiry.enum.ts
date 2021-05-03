export enum InquiryType {
  GENERAL = 0,
  TECHNICAL,
  PAYMENT,
  OTHER
}

export const InquiryTypeDescription = {
  [InquiryType.GENERAL]: 'General Question',
  [InquiryType.TECHNICAL]: 'Technical Question',
  [InquiryType.PAYMENT]: 'Payment',
  [InquiryType.OTHER]: 'Other'
};
