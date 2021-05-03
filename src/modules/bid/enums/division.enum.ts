import { ProjectType } from '.';
import { Bid } from '../entities';

export enum Division {
  DIV_1 = 'division_1',
  DIV_2 = 'division_2',
  DIV_3_4 = 'division_3_4',
  DIV_5_7 = 'division_5_7',
  DIV_8 = 'division_8',
  DIV_9 = 'division_9',
  DIV_10 = 'division_10',
  DIV_11_12 = 'division_11_12',
  DIV_13 = 'division_13',
  DIV_15 = 'division_15',
  DIV_15_1 = 'division_15_1',
  DIV_16 = 'division_16'
}

export const DivisionNames: { [type in Division]: string } = Object.freeze({
  [Division.DIV_1]: 'DIV 1',
  [Division.DIV_2]: 'DIV 2',
  [Division.DIV_3_4]: 'DIV 3 & 4',
  [Division.DIV_5_7]: 'DIV 5 & 7',
  [Division.DIV_8]: 'DIV 8',
  [Division.DIV_9]: 'DIV 9',
  [Division.DIV_10]: 'DIV 10',
  [Division.DIV_11_12]: 'DIV 11 & 12',
  [Division.DIV_13]: 'DIV 13',
  [Division.DIV_15]: 'DIV 15',
  [Division.DIV_15_1]: 'DIV 15.1',
  [Division.DIV_16]: 'DIV 16'
});

export const DivisionDescriptions = (bid: Bid) =>
  Object.freeze({
    [Division.DIV_1]: 'Supervision/General Condition/ Project Management',
    [Division.DIV_2]: 'Site Condition - Demolition & haul',
    [Division.DIV_3_4]: 'Concrete/ Masonry (Sawcut/Concrete pour back/Drill)',
    [Division.DIV_5_7]: 'Metals - Framing/Metal studs, Drywall & Insulation',
    [Division.DIV_8]: 'Openings - Doors, Frames, Windows and storefront system',
    [Division.DIV_9]: 'Specialties - Restroom accessories, extinguishers, mirrors and others',
    [Division.DIV_10]: 'Finishes - ACT, paint, tile, wall-paper, epoxy and installation millwork/cabinets',
    [Division.DIV_11_12]: 'Install Equipment/Appliances',
    [Division.DIV_13]: 'Special Construction - Fire Protection Alarm and Sprinkler',
    [Division.DIV_15]:
      bid.projectType === ProjectType.RESTAURANT
        ? 'Mechanical - HVAC units, duct work, sensors and  Hoods with Grease duct'
        : 'Mechanical - HVAC units, duct work, thermostat sensors and others',
    [Division.DIV_15_1]: 'Plumbing',
    [Division.DIV_16]: 'Electrical - Furnish & Install Light fixtures and control panels'
  });
