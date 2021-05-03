import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import { defaults, forOwn, isEmpty } from 'lodash';

import {
  BidPricingSelection,
  AcHvacUnits,
  AMEPSheetsUpload,
  BuildingType,
  CellAreaColumn,
  CellAreaRow,
  CellCalendarSqFtColumn,
  CellDivRow,
  CellInspectionRow,
  CellSqFtColumn,
  Division,
  ExcelSheetName,
  FinishesType,
  FloorLevel,
  FloorLevelFactor,
  InspectionBreakdownCell,
  PlansUploaded,
  ProjectType,
  Region,
  ConstructionType,
  StoreInfoType,
  WorkingDaysCalendar
} from '../enums';
import { User } from '../../base/entities';
import { Address, Bid, Plans, ProjectDetails, ProjectEstimate, State } from '../entities';
import {
  AddressUpdateDto,
  BidCostDto,
  BidPricingDto,
  BidPricingUpdateDto,
  DivisionValue,
  Inspections,
  ProjectCoverParams,
  ProjectCreateDto,
  ProjectDetailsDto,
  ProjectEstimateDto,
  ProjectPlanUpdateDto,
  ProjectUpdateDto
} from '../dtos';
import {
  AddressRepository,
  BidPricingRepository,
  BidRepository,
  EstimateDataRepository,
  ProjectDetailsRepository,
  ProjectEstimateRepository
} from '../repositories';
import { StateService } from '../../base/services/state.service';
import { DEFAULT_SEARCH_PARAMS, SearchParamsDto } from '../../base/dtos';
import {
  getSqFtBracket,
  getSqFtFactor,
  inRange,
  SquareFeetCalendarRange,
  SquareFeetRange
} from '../enums/square-feet-range.enum';
import { ProfitMarginValue } from '../enums/profit-margin.enum';
import { ReportService } from '../../base/services';
import { BidPricing } from '../entities/bid-pricing.entity';
import { InjectRepository } from '../..';

const cellStringConverter = (column: string, row: number): string => `${column}${row}`;

@Injectable()
export class BidService {
  public constructor(
    private readonly bidRepository: BidRepository,
    private readonly projectDetailsRepository: ProjectDetailsRepository,
    private readonly projectEstimateRepository: ProjectEstimateRepository,
    private readonly estimateDataRepository: EstimateDataRepository,
    private readonly addressRepository: AddressRepository,
    private readonly stateService: StateService,
    private readonly reportService: ReportService,
    private readonly bidPricingRepository: BidPricingRepository,
    @InjectRepository(Plans) private readonly bidPlansRepository: Repository<Plans>
  ) {}

  public async isBidOwner(bidId: number, userId: number): Promise<boolean> {
    const bidOwner = await this.bidRepository.findOne({ where: { id: bidId, user: { id: userId } } });
    return !!bidOwner;
  }

  // CELL P9
  private getFloorLevel(buildingType: BuildingType, floor: FloorLevel): number {
    return [BuildingType.STRIP_CENTER, BuildingType.STANDALONE_BLDG].includes(buildingType)
      ? FloorLevel.FIRST_FLOOR
      : floor;
  }

  // CELL Q9
  private getFloorLevelFactor(buildingType: BuildingType, floor: FloorLevel): number {
    if ([BuildingType.INSIDE_MALL, BuildingType.HIGHRISE].includes(buildingType)) {
      return (
        FloorLevelFactor[floor] ??
        (buildingType === BuildingType.HIGHRISE
          ? FloorLevelFactor[FloorLevel.THIRD_OR_HIGHER]
          : FloorLevelFactor[FloorLevel.FIRST_FLOOR])
      );
    }
    return 1;
  }

  /** CELL P15 */
  private getAreaWithinLimit(sqFt: number): number {
    return sqFt < SquareFeetRange._500 || sqFt > SquareFeetRange._5000 ? 0 : sqFt;
  }

  // CELL P12
  private getACUnitsAreaFactor(sqFt: number, storeInfo: string): number {
    const sqFtVal = this.getAreaWithinLimit(sqFt);
    if (storeInfo === StoreInfoType.NEW) {
      if (sqFtVal < 2500) {
        return 1.35;
      } else {
        return 1.1;
      }
    } else {
      return 0.85;
    }
  }

  private getDefaultCellValue(row: number, sheetName: string, workbook: Workbook): number {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new InternalServerErrorException(
        `Error: missing dataset for ${sheetName}. Please check your estimate data.`
      );
    }
    const cell = `B${row + 2}`;
    return worksheet.getCell(cell).value as number;
  }

  private getDivisionDefaultPrice(sqFt: number, division: Division, projectType: number, workbook: Workbook): number {
    const divAreaPercentage = workbook.getWorksheet(ExcelSheetName.DIV_AREA_PERCENTAGE);
    const divAreaPrice = workbook.getWorksheet(ExcelSheetName.DIV_AREA_PRICE);
    const divSqftPercentage = workbook.getWorksheet(ExcelSheetName.DIV_SQFT_PERCENTAGE);
    const areaSqftPercentage = workbook.getWorksheet(ExcelSheetName.AREA_SQFT_PERCENTAGE);

    const sqFtVal = getSqFtBracket(sqFt); // CELL S16 - // TODO: Move default numbers in excel template?
    let divisionDefaultValue: number;
    let divSqftPercent: number;

    const sqFtsToInclude = Object.keys(CellSqFtColumn).map(Number); // each sq ft bracket inherits values from their lower brackets.
    const repetitionsForBracket = sqFtsToInclude.indexOf(sqFtVal) + 1; // start at base 1
    // used to incrementally compute div price starting from lowest squarefeet area and repeat until the current sqFtVal.
    for (let step = 0; step < repetitionsForBracket; step++) {
      const baseBracket = sqFtsToInclude[step];
      const areaSqFtCell = cellStringConverter(CellSqFtColumn[baseBracket], CellAreaRow[projectType]);
      const areaSqFtCellValue = areaSqftPercentage.getCell(areaSqFtCell).value as number;
      const areaSqFtPercent = 1 + areaSqFtCellValue;

      const divAreaCell = cellStringConverter(CellAreaColumn[projectType], CellDivRow[division]);
      const divAreaCellValue = divAreaPercentage.getCell(divAreaCell).value as number;
      const divAreaPercent = 1 + divAreaCellValue;

      const divSqftCell = cellStringConverter(CellSqFtColumn[baseBracket], CellDivRow[division]);
      const divSqftCellValue = divSqftPercentage.getCell(divSqftCell).value as number;
      divSqftPercent = 1 + divSqftCellValue;

      const divAreaPriceCell = cellStringConverter(CellAreaColumn[projectType], CellDivRow[division]);
      const divAreaPriceCellValue = divAreaPrice.getCell(divAreaPriceCell).value as number;

      divisionDefaultValue =
        (step === 0 ? divAreaPriceCellValue : divisionDefaultValue) * ((divAreaPercent + areaSqFtPercent) / 2);

      // clean-up any bad floating-point decimal ends before next loop
      divisionDefaultValue = Number(parseFloat(`${divisionDefaultValue}`));
    }
    const val = divisionDefaultValue * divSqftPercent;
    return val;
  }

  private getDivision16Estimate(divArea: number, areaLimit: number): number {
    return (
      divArea *
      areaLimit *
      (areaLimit <= 1000 ? 1.335 : areaLimit <= 2000 ? 1.4 : areaLimit <= 3500 ? 1.25 : areaLimit <= 5000 ? 1.1 : 0)
    );
  }

  private async getDivisionAreaPrice(bid: Bid, details: ProjectDetails): Promise<DivisionValue> {
    const {
      projectType,
      region,
      amepPlan,
      mPlan,
      ePlan,
      pPlan,
      estimateData: { data: excelBlob }
    } = bid;
    const dataWorkbook = await new Workbook().xlsx.load(excelBlob);

    const unknownBuildingType = Object.keys(BuildingType).length / 2;
    const unknownRegion = Object.keys(Region).length / 2;

    const { squareFoot, buildingType, floor, constructionType, storefront, finishes, acHvacUnits } = details;
    const regionCellValue = this.getDefaultCellValue(
      region === null ? unknownRegion : region,
      ExcelSheetName.EST_REGION,
      dataWorkbook
    );
    const buildingTypeCellValue = this.getDefaultCellValue(
      buildingType === null ? unknownBuildingType : buildingType,
      ExcelSheetName.EST_BUILDING_INFO,
      dataWorkbook
    );

    const floorLevelValue = this.getFloorLevel(buildingType, floor);
    const floorLevelCellValue = this.getDefaultCellValue(floorLevelValue, ExcelSheetName.EST_FLOOR_LEVEL, dataWorkbook);
    const floorLevelFactorValue = this.getFloorLevelFactor(buildingType, floor);
    const areaDividedWithFactorValue = getSqFtFactor(squareFoot);
    const acHvacUnitsFactorValue = this.getACUnitsAreaFactor(squareFoot, acHvacUnits);
    const areaLimit = this.getAreaWithinLimit(squareFoot);

    const mPlanVal = this.getDefaultCellValue(mPlan, ExcelSheetName.CAL_M_PLAN, dataWorkbook);
    const ePlanVal = this.getDefaultCellValue(ePlan, ExcelSheetName.CAL_E_PLAN, dataWorkbook);
    const pPlanVal = this.getDefaultCellValue(pPlan, ExcelSheetName.CAL_P_PLAN, dataWorkbook);

    const planUploadedValues = bid.amepPlan === AMEPSheetsUpload.YES ? 1 : mPlanVal * pPlanVal * ePlanVal;

    /* eslint-disable @typescript-eslint/camelcase */
    const div1PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_1, projectType, dataWorkbook);
    const div2PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_2, projectType, dataWorkbook);
    const div3_4PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_3_4, projectType, dataWorkbook);
    const div5_7PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_5_7, projectType, dataWorkbook);
    const div8PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_8, projectType, dataWorkbook);
    const div9PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_9, projectType, dataWorkbook);
    const div10PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_10, projectType, dataWorkbook);
    const div11_12PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_11_12, projectType, dataWorkbook);
    const div13PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_13, projectType, dataWorkbook);
    const div15PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_15, projectType, dataWorkbook);
    const div15_1PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_15_1, projectType, dataWorkbook);
    const div16PriceValue = this.getDivisionDefaultPrice(squareFoot, Division.DIV_16, projectType, dataWorkbook);
    const div16_cond = this.getDivision16Estimate(div16PriceValue, areaLimit);

    const divisions = {
      [Division.DIV_1]:
        div1PriceValue *
        areaDividedWithFactorValue *
        regionCellValue *
        buildingTypeCellValue *
        floorLevelCellValue *
        (floorLevelFactorValue * 1.25) *
        planUploadedValues,
      [Division.DIV_2]:
        constructionType === ConstructionType.NEW_SHELL
          ? 0
          : div2PriceValue * areaLimit * regionCellValue * buildingTypeCellValue * floorLevelCellValue,
      [Division.DIV_3_4]: div3_4PriceValue * areaLimit * regionCellValue * buildingTypeCellValue * floorLevelCellValue,
      [Division.DIV_5_7]:
        div5_7PriceValue * areaDividedWithFactorValue * regionCellValue * buildingTypeCellValue * floorLevelCellValue,
      [Division.DIV_8]:
        (storefront === StoreInfoType.NEW
          ? div8PriceValue * areaLimit * 0.35 + 54321
          : div8PriceValue * areaLimit * 0.525) *
        regionCellValue *
        buildingTypeCellValue *
        floorLevelCellValue *
        floorLevelFactorValue,
      [Division.DIV_9]:
        pPlan === AMEPSheetsUpload.NO
          ? 0
          : div9PriceValue * areaLimit * regionCellValue * buildingTypeCellValue * floorLevelCellValue,
      [Division.DIV_10]:
        div10PriceValue *
        areaDividedWithFactorValue *
        (finishes === FinishesType.BASIC ? 0.715 : finishes === FinishesType.HIGHEND ? 1.515 : 1) *
        regionCellValue *
        buildingTypeCellValue *
        floorLevelCellValue *
        floorLevelFactorValue,
      [Division.DIV_11_12]:
        div11_12PriceValue * areaDividedWithFactorValue * regionCellValue * buildingTypeCellValue * floorLevelCellValue,
      [Division.DIV_13]:
        div13PriceValue *
        areaLimit *
        regionCellValue *
        buildingTypeCellValue *
        floorLevelCellValue *
        floorLevelFactorValue,
      [Division.DIV_15]:
        mPlan === AMEPSheetsUpload.NO
          ? 0.0
          : div15PriceValue *
            areaDividedWithFactorValue *
            acHvacUnitsFactorValue *
            (finishes === FinishesType.BASIC ? 0.95 : finishes === FinishesType.HIGHEND ? 1.23 : 1) *
            regionCellValue *
            buildingTypeCellValue *
            floorLevelCellValue *
            floorLevelFactorValue,
      [Division.DIV_15_1]:
        pPlan === AMEPSheetsUpload.NO
          ? 0.0
          : div15_1PriceValue *
            areaDividedWithFactorValue *
            (finishes === FinishesType.BASIC ? 0.9 : finishes === FinishesType.HIGHEND ? 1.1 : 1) *
            regionCellValue *
            buildingTypeCellValue *
            floorLevelCellValue *
            floorLevelFactorValue,
      [Division.DIV_16]:
        ePlan === AMEPSheetsUpload.NO
          ? 0.0
          : (finishes === FinishesType.BASIC
              ? div16PriceValue * areaLimit * 0.7
              : finishes === FinishesType.HIGHEND
              ? div16_cond
              : div16PriceValue * areaLimit * 0.95) *
            regionCellValue *
            buildingTypeCellValue *
            floorLevelCellValue *
            floorLevelFactorValue
    };
    return divisions;
  }

  private getTotalInspectionByType(bid: Bid): number {
    const { mPlan, ePlan, pPlan, projectType } = bid;
    const projectTypeVal = projectType === ProjectType.RESTAURANT ? 15 : 11;
    const mPlanVal = mPlan === AMEPSheetsUpload.NO ? (projectType === ProjectType.RESTAURANT ? -4 : -2) : 0;
    const ePlanVal = ePlan === AMEPSheetsUpload.YES ? 0 : -2;
    const pPlanVal = pPlan === AMEPSheetsUpload.NO ? (projectType === ProjectType.RESTAURANT ? -4 : -2) : 0;
    return projectTypeVal + mPlanVal + ePlanVal + pPlanVal;
  }
  private async getInspectionEstimates(bid: Bid): Promise<Inspections> {
    const {
      mPlan,
      projectType,
      estimateData: { data: excelBlob }
    } = bid;
    const worksheets = await new Workbook().xlsx.load(excelBlob);
    const inspectionWorksheet = worksheets.getWorksheet(ExcelSheetName.INSPECTION_BREAKDOWN);
    const totalInspections = this.getTotalInspectionByType(bid);

    const cellSuffix =
      projectType === ProjectType.RESTAURANT
        ? totalInspections === 9
          ? mPlan === AMEPSheetsUpload.YES
            ? '_M'
            : '_P'
          : totalInspections === 11
          ? mPlan === AMEPSheetsUpload.YES
            ? '_ME'
            : '_EP'
          : ''
        : '';

    const col = InspectionBreakdownCell[`_${totalInspections}${cellSuffix}`];
    const {
      roughInspections,
      finalInspections,
      greaseDuctInspections,
      preHealthInspections,
      finalBldgInspections,
      fireDeptInspections,
      finalHealthInspections
    } = Object.assign(
      {},
      ...Object.keys(CellInspectionRow).map(prop => ({
        [prop]: inspectionWorksheet.getCell(`${col}${CellInspectionRow[prop]}`).value as number
      }))
    );

    return {
      totalInspections,
      roughInspections,
      finalInspections,
      greaseDuctInspections,
      preHealthInspections,
      finalBldgInspections,
      fireDeptInspections,
      finalHealthInspections
    };
  }

  private getAreaForCalendar(sqFt: number): number {
    return inRange(sqFt)
      ? sqFt < 800
        ? SquareFeetCalendarRange._500
        : sqFt < 1400
        ? SquareFeetCalendarRange._1000
        : sqFt < 2800
        ? SquareFeetCalendarRange._2000
        : sqFt < 4200
        ? SquareFeetCalendarRange._3500
        : sqFt <= 5000
        ? SquareFeetCalendarRange._5000
        : 0
      : 0;
  }

  private getStructuralValue(sqFt: number, constructionType: ConstructionType): number {
    return constructionType === ConstructionType.RENOVATION_WITH_DEMOLITION
      ? sqFt < SquareFeetRange._1500
        ? 1
        : sqFt < SquareFeetRange._3500
        ? 1.75
        : sqFt <= SquareFeetRange._5000
        ? 2.5
        : 0
      : 0;
  }

  private getNewStorefrontValue(sqFt: number, storefront: StoreInfoType): number {
    return storefront === StoreInfoType.NEW
      ? sqFt < SquareFeetRange._1500
        ? 1.25
        : sqFt < SquareFeetRange._3500
        ? 1.375
        : sqFt <= SquareFeetRange._5000
        ? 1.5
        : 0
      : 0;
  }

  private getNewAcHvacUnitValue(sqFt: number, acHvacUnits: AcHvacUnits): number {
    return acHvacUnits === AcHvacUnits.NEW
      ? sqFt < SquareFeetRange._1500
        ? 1.2
        : sqFt < SquareFeetRange._3500
        ? 1.35
        : sqFt <= SquareFeetRange._5000
        ? 1.5
        : 0
      : 0;
  }

  private async getCalendarEstimates(bid: Bid, projectDetails: ProjectDetails): Promise<number> {
    const { buildingType, floor, squareFoot, constructionType, storefront, acHvacUnits } = projectDetails;
    const {
      projectType,
      region,
      mPlan,
      ePlan,
      pPlan,
      estimateData: { data: excelBlob }
    } = bid;
    const unknownBuildingType = Object.keys(BuildingType).length / 2;
    const unknownRegion = Object.keys(Region).length / 2;

    const dataWorkbook = await new Workbook().xlsx.load(excelBlob);
    const areaCalendar = dataWorkbook.getWorksheet(ExcelSheetName.CAL_AREA);

    const sqFtVal = this.getAreaForCalendar(squareFoot);
    const areaCalendarCell = cellStringConverter(CellCalendarSqFtColumn[sqFtVal], CellAreaRow[projectType]);
    const areaCalendarValue = areaCalendar.getCell(areaCalendarCell).value as number;

    const regionVal = this.getDefaultCellValue(
      region === null ? unknownRegion : region,
      ExcelSheetName.CAL_REGION,
      dataWorkbook
    );
    const buildingTypeVal = this.getDefaultCellValue(
      buildingType === null ? unknownBuildingType : buildingType,
      ExcelSheetName.CAL_BUILDING_INFO,
      dataWorkbook
    );
    const floorVal = this.getDefaultCellValue(floor, ExcelSheetName.CAL_FLOOR_LEVEL, dataWorkbook);
    const mPlanVal = this.getDefaultCellValue(mPlan, ExcelSheetName.CAL_M_PLAN, dataWorkbook);
    const ePlanVal = this.getDefaultCellValue(ePlan, ExcelSheetName.CAL_E_PLAN, dataWorkbook);
    const pPlanVal = this.getDefaultCellValue(pPlan, ExcelSheetName.CAL_P_PLAN, dataWorkbook);
    const workingDaysVal = this.getDefaultCellValue(
      WorkingDaysCalendar.WEEKENDS,
      ExcelSheetName.CAL_WORKING_DAYS,
      dataWorkbook
    );

    const calendarEstimate =
      (areaCalendarValue * workingDaysVal +
        this.getStructuralValue(squareFoot, constructionType) +
        this.getNewStorefrontValue(squareFoot, storefront as StoreInfoType) +
        this.getNewAcHvacUnitValue(squareFoot, acHvacUnits as AcHvacUnits)) *
      regionVal *
      buildingTypeVal *
      floorVal *
      mPlanVal *
      pPlanVal *
      ePlanVal;

    return Math.ceil(calendarEstimate);
  }

  public async getEstimateCalculations(bidId: number): Promise<ProjectEstimateDto> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      join: {
        alias: 'bid',
        leftJoinAndSelect: {
          estimateData: 'bid.estimateData',
          address: 'bid.address',
          state: 'address.state'
        }
      }
    });
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }
    const details = await this.projectDetailsRepository.findByBidId(bid.id);
    if (!details) {
      throw new BadRequestException('Bid details are missing.');
    }
    const { squareFoot, profitMargin: profitMarginKey } = details;

    const divisionPrices: DivisionValue = await this.getDivisionAreaPrice(bid, details);
    const sumOfDivisions = Math.round(Object.values(divisionPrices).reduce((a, b) => a + b) * 1000) / 1000;
    const profitMargin = Math.round(sumOfDivisions * ProfitMarginValue[profitMarginKey] * 1000) / 1000;
    const totalCost = Math.round((profitMargin + sumOfDivisions) * 100) / 100;

    const daysToComplete = await this.getCalendarEstimates(bid, details);
    const inspections = await this.getInspectionEstimates(bid);
    const costPerSq = Math.round((totalCost / squareFoot) * 100) / 100;
    const divisions = forOwn(divisionPrices, (value, key) => Math.round(value * 100) / 100);

    const { id: savedEstimateId } = (await this.projectEstimateRepository.findByBidId(bid.id)) || {};
    await this.projectEstimateRepository.save({
      ...divisions,
      bid,
      profitMargin,
      totalCost,
      daysToComplete,
      costPerSq,
      ...inspections,
      id: savedEstimateId
    } as ProjectEstimate);

    return {
      divisions,
      profitMargin,
      totalCost,
      daysToComplete,
      inspections,
      costPerSq
    };
  }

  public async getEstimateDataFile(bidId: number, res: any): Promise<void> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      join: {
        alias: 'bid',
        leftJoinAndSelect: {
          estimateData: 'bid.estimateData'
        }
      }
    });
    const { estimateData } = bid;
    if (isEmpty(estimateData) || !estimateData.data) {
      throw new BadRequestException(`No Excel formula estimate data for bid #${bidId}.`);
    }

    const { data, name } = estimateData;
    const excelFile = await new Workbook().xlsx.load(data);
    res.append('Content-Type', 'application/vnd.ms-excel');
    res.append('Content-Disposition', `attachment; filename="${name}.xlsx"`);
    await excelFile.xlsx.write(res);
    res.end();
  }

  public async create(bid: ProjectCreateDto, user: User): Promise<Bid> {
    const estimateData = await this.estimateDataRepository.getLatest();
    if (!estimateData) {
      throw new NotFoundException('No estimate dataset file found');
    }

    const address = await this.saveBidAddress(bid.address);
    const plansData = this.initializePlans(bid);
    return this.bidRepository.save({ ...bid, ...plansData, user, address, estimateData });
  }

  public async update(bidUpdate: ProjectUpdateDto): Promise<Bid> {
    let address: Address;

    const bid = await this.bidRepository.findById(bidUpdate.id);
    if (!bid) {
      throw new NotFoundException('Bid not found.');
    }

    if (bidUpdate.address) {
      address = await this.saveBidAddress({ ...bidUpdate.address, id: bid.address.id });
    }

    const plansData = this.initializePlans(bidUpdate);
    return this.bidRepository.save({
      id: bid.id,
      ...bidUpdate,
      ...plansData,
      address
    });
  }

  public async remove(id: number): Promise<UpdateResult> {
    return this.bidRepository.update({ id }, { deleted: true });
  }

  public async saveBidAddress(address: AddressUpdateDto): Promise<Address> {
    let state = {} as State;

    if (address.stateId) {
      state = await this.stateService.findById(address.stateId);
      if (!state) {
        throw new BadRequestException('No state was found');
      }
    }

    const savedAddress = await this.addressRepository.save({ ...address, state });
    if (!savedAddress) {
      throw new InternalServerErrorException('Failed to save address');
    }
    return savedAddress;
  }

  public initializePlans(bid: ProjectCreateDto | ProjectUpdateDto | Bid): Bid {
    let amepPlan: AMEPSheetsUpload;
    let mPlan: AMEPSheetsUpload;
    let ePlan: AMEPSheetsUpload;
    let pPlan: AMEPSheetsUpload;
    if (bid.plansUploaded === PlansUploaded.NO_UPLOAD) {
      // Initialize MEP flags
      amepPlan = AMEPSheetsUpload.NO;
      mPlan = AMEPSheetsUpload.NO;
      ePlan = AMEPSheetsUpload.NO;
      pPlan = AMEPSheetsUpload.NO;
      return {
        ...new Bid(),
        ...bid,
        amepPlan,
        mPlan,
        ePlan,
        pPlan
      } as Bid;
    }
    return bid as Bid;
  }

  public async findById(id: number): Promise<Bid> {
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }
    return bid;
  }

  public async getAllOwned(userId: number, searchParams: SearchParamsDto): Promise<BidCostDto[]> {
    const { page, limit, sort } = defaults(searchParams, DEFAULT_SEARCH_PARAMS);
    return this.bidRepository.getAllOwned(page, limit, sort, userId);
  }

  public async getOwnedCount(userId: number): Promise<number> {
    return this.bidRepository.getOwnedCount(userId);
  }

  public async getDetails(bidId: number): Promise<ProjectDetails> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }

    return this.projectDetailsRepository.findByBidId(bid.id);
  }

  public async saveDetails(bidId: number, details: ProjectDetailsDto): Promise<ProjectDetails> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }

    const { id: detailsId } = (await this.projectDetailsRepository.findByBidId(bid.id)) || {};
    return this.projectDetailsRepository.save({ ...details, bid, id: detailsId });
  }

  public async getEstimate(bidId: number): Promise<ProjectEstimateDto> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, deleted: false },
      join: {
        alias: 'bid',
        leftJoinAndSelect: {
          estimateData: 'bid.estimateData',
          address: 'bid.address',
          state: 'address.state'
        }
      }
    });
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }

    const estimate = await this.projectEstimateRepository.findByBidId(bid.id);
    if (!estimate) {
      return;
    }

    const {
      profitMargin,
      totalCost,
      daysToComplete,
      costPerSq,
      division_1,
      division_2,
      division_3_4,
      division_5_7,
      division_8,
      division_9,
      division_10,
      division_11_12,
      division_13,
      division_15,
      division_15_1,
      division_16,
      totalInspections,
      roughInspections,
      finalInspections,
      greaseDuctInspections,
      preHealthInspections,
      finalBldgInspections,
      fireDeptInspections,
      finalHealthInspections
    } = estimate;
    const estimateDto: ProjectEstimateDto = {
      divisions: {
        division_1,
        division_2,
        division_3_4,
        division_5_7,
        division_8,
        division_9,
        division_10,
        division_11_12,
        division_13,
        division_15,
        division_15_1,
        division_16
      },
      profitMargin,
      totalCost,
      daysToComplete,
      inspections: {
        totalInspections,
        roughInspections,
        finalInspections,
        greaseDuctInspections,
        preHealthInspections,
        finalBldgInspections,
        fireDeptInspections,
        finalHealthInspections
      },
      costPerSq
    };

    return estimateDto;
  }

  public async downloadBidEstimatePDF(bidId: number, res: any): Promise<void> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }
    const estimate = await this.getEstimate(bid.id);
    if (!estimate) {
      throw new UnprocessableEntityException(`This bid's estimates seem to have not been computed yet.`);
    }

    await this.reportService.downloadBidEstimatePDF(bid, estimate, res);
  }

  public async downloadBidCoverPDF(coverParams: ProjectCoverParams, res: any) {
    await this.reportService.downloadBidCoverPreviewPDF(coverParams, res);
  }

  public async updatePlans(id: number, plans: ProjectPlanUpdateDto): Promise<Bid> {
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException();
    }
    await this.bidRepository.update(bid, { ...plans });
    return bid;
  }

  public async getBidPricing(id: number): Promise<BidPricingDto> {
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException();
    }
    const estimate = await this.projectEstimateRepository.findByBidId(id);
    if (!estimate) {
      throw new NotFoundException();
    }
    const pricing = await this.bidPricingRepository.findByBidId(id);
    let newPricing: BidPricing;
    const { totalCost, daysToComplete } = estimate;
    const mediumPricing = {
      mediumCost: +totalCost,
      mediumSchedule: daysToComplete
    };

    if (!pricing) {
      const low = totalCost * (totalCost < 1000000 ? 0.83 : totalCost < 2000000 ? 0.88 : 0.94);
      const high = totalCost * (totalCost < 500000 ? 1.17 : totalCost < 1000000 ? 1.12 : 1.07);
      const goodPrice = totalCost * 1.03;

      newPricing = {
        ...new BidPricing(),
        bid,
        lowCost: Math.round(low * 100) / 100,
        lowSchedule: Math.ceil(daysToComplete * 1.15),
        highCost: Math.round(high * 100) / 100,
        highSchedule: Math.ceil(daysToComplete * 0.85),
        goodCost: Math.round(goodPrice * 100) / 100
      };
      await this.bidPricingRepository.save(newPricing);
    }
    const retvalPricing = {
      lowCost: pricing ? pricing.lowCost : newPricing.lowCost,
      lowSchedule: pricing ? pricing.lowSchedule : newPricing.lowSchedule,
      highCost: pricing ? pricing.highCost : newPricing.highCost,
      highSchedule: pricing ? pricing.highSchedule : newPricing.highSchedule,
      goodCost: pricing ? pricing.goodCost : newPricing.goodCost
    };
    return {
      pricing: retvalPricing,
      ...mediumPricing,
      selected: pricing ? pricing.selected : BidPricingSelection.NONE
    };
  }

  public async updateBidPricing(id: number, data: BidPricingUpdateDto): Promise<BidPricing> {
    const { selected } = data;
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException();
    }
    const pricing = await this.bidPricingRepository.findByBidId(id);
    if (!pricing) {
      throw new NotFoundException();
    }
    pricing.selected = selected;
    await this.bidPricingRepository.update(pricing.id, { selected });
    return pricing;
  }

  public async downloadBidPricingXLS(bidId: number, res: any): Promise<void> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }

    const details = await this.projectDetailsRepository.findByBidId(bid.id);
    if (!details) {
      throw new BadRequestException('Bid details are missing.');
    }

    const estimate = await this.getEstimate(bid.id);
    if (!estimate) {
      throw new UnprocessableEntityException(`This bid's estimates seem to have not been computed yet.`);
    }

    const pricing = await this.bidPricingRepository.findByBidId(bid.id);
    if (!pricing) {
      throw new UnprocessableEntityException(`Bid pricing has not been computed`);
    }

    await this.reportService.downloadBidPricingXLS(bid, details, estimate, pricing, res);
  }

  public async downloadBidPlans(id: number, res: Response): Promise<void> {
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException('No bid was found');
    }
    const bidPlans = await this.bidPlansRepository.find({ where: { bid: { id }, deleted: false } });
    if (!bidPlans) {
      throw new NotFoundException(`No plans are uploaded for this bid`);
    }

    await this.reportService.downloadBidPlans(bid, bidPlans, res);
  }
}
