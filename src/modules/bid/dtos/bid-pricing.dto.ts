import { BidPricingSelection } from '../enums';

export type PartialBidPricing = {
  lowCost: number;
  lowSchedule: number;
  highCost: number;
  highSchedule: number;
  goodCost: number;
};

export class BidPricingDto {
  pricing: PartialBidPricing;
  mediumCost: number;
  mediumSchedule: number;
  selected: BidPricingSelection;
}
