import { first, last } from 'lodash';

/** Keys refer to inclusive bottom-starting range of that value.
 * Example: 500 means 500 and up
 */
export enum SquareFeetRange {
  DONT_KNOW = 0,
  _500 = 500,
  _700 = 700,
  _900 = 900,
  _1100 = 1100,
  _1300 = 1300,
  _1500 = 1500,
  _2000 = 2000,
  _2500 = 2500,
  _3000 = 3000,
  _3500 = 3500,
  _4000 = 4000,
  _4500 = 4500,
  _5000 = 5000
}

/**
 * Calendar estimates cover a more broad range of square feet (therefore less)
 */
export enum SquareFeetCalendarRange {
  _500 = 500,
  _1000 = 1000,
  _2000 = 2000,
  _3500 = 3500,
  _5000 = 5000
}

/** Array of our entire SquareFeetRange. Reuse for looping since enums misbehave. */
export const getSqFtKeys = () => {
  const choices = Object.values(SquareFeetRange);
  return choices.splice(0, choices.length / 2); // keys only
};

const min: SquareFeetRange = Number(SquareFeetRange[first(getSqFtKeys().slice(1))]);
const max: SquareFeetRange = Number(SquareFeetRange[last(getSqFtKeys())]);
export const inRange = sqFt => (sqFt >= min && sqFt <= max ? sqFt : SquareFeetRange.DONT_KNOW);

/**
 * Derived from this previous logic.
 * return sqFt < 500
      ? 0
      : sqFt < 900
      ? 700
      : sqFt < 1100
      ? 900
      : sqFt < 1300
      ? 1100
      : sqFt < 1500
      ? 1300
      : sqFt < 2000
      ? 1500
      : sqFt < 2500
      ? 2000
      : sqFt < 3000
      ? 2500
      : sqFt < 3500
      ? 3000
      : sqFt < 4000
      ? 3500
      : sqFt < 4500
      ? 4000
      : sqFt <= 5000
      ? 4500
      : 0;
 * Go up the range of squarefeet choices and return the nearest.
 * @param sqFt -  user-provided value
 */
export const getSqFtBracket = (sqFt: number) => {
  // TODO: bug for values under 700.
  // let actual = SquareFeetRange.DONT_KNOW;
  // if (!inRange(sqFt)) {
  //   return actual;
  // }
  // const ranges = getSqFtKeys().slice(2); // skip dont_know and 500
  // actual = Number(SquareFeetRange[ranges[0]]); // initialize starting value to 700

  // for (const range of ranges) {
  //   const bracket = Number(SquareFeetRange[range]);

  //   if (bracket === sqFt && bracket === max) {
  //     return actual; // return previously memoized
  //   } else if (sqFt < bracket && sqFt >= actual) {
  //     return actual;
  //   } else {
  //     actual = bracket; // memoize then check next bracket
  //   }
  // }
  // return SquareFeetRange.DONT_KNOW;

  return !inRange(sqFt)
    ? SquareFeetRange.DONT_KNOW
    : sqFt < SquareFeetRange._900
    ? SquareFeetRange._700
    : sqFt < SquareFeetRange._1100
    ? SquareFeetRange._900
    : sqFt < SquareFeetRange._1300
    ? SquareFeetRange._1100
    : sqFt < SquareFeetRange._1500
    ? SquareFeetRange._1300
    : sqFt < SquareFeetRange._2000
    ? SquareFeetRange._1500
    : sqFt < SquareFeetRange._2500
    ? SquareFeetRange._2000
    : sqFt < SquareFeetRange._3000
    ? SquareFeetRange._2500
    : sqFt < SquareFeetRange._3500
    ? SquareFeetRange._3000
    : sqFt < SquareFeetRange._4000
    ? SquareFeetRange._3500
    : sqFt < SquareFeetRange._4500
    ? SquareFeetRange._4000
    : SquareFeetRange._4500;
};

/** OwnerPage!T15 */
export const SqFeetFactor = {
  [SquareFeetRange._900]: 0.99,
  [SquareFeetRange._2000]: 0.8,
  [SquareFeetRange._3000]: 0.85,
  [SquareFeetRange._4000]: 0.9,
  [SquareFeetRange._5000]: 0.95
};
export const getSqFtFactor = (sqFt: number) => {
  for (const sqFeetRange of Object.keys(SqFeetFactor)) {
    if (sqFt <= Number(sqFeetRange)) {
      return sqFt * SqFeetFactor[sqFeetRange];
    }
  }
  return SquareFeetRange.DONT_KNOW;
};
