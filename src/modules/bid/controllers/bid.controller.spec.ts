import { HttpStatus } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { random } from 'faker';

import TestFactory, { TestingModuleMetadata } from '../../../test.factory';
import { Role, RoleEnum, User } from '../../base/entities';
import { Bid, EstimateData, ProjectDetails, State } from '../entities';
import {
  BidPricingSelection,
  AcHvacUnits,
  BuildingType,
  BusinessType,
  FinishesType,
  FloorLevel,
  AMEPSheetsUpload,
  PlansUploaded,
  ProjectType,
  Region,
  ConstructionType,
  StoreInfoType,
  Workscope
} from '../enums';
import { AddressUpdateDto, ProjectCreateDto, ProjectDetailsDto, ProjectEstimateDto, ProjectUpdateDto } from '../dtos';
import { ProfitMargin } from '../enums/profit-margin.enum';

let adminAccessToken: string;
let normalAccessToken: string;

let estimateData: EstimateData;
let bid1: Bid;
let deletedBid: Bid;
let bidDetails1: ProjectDetails;
let noBidEstimate: Bid;

let adminUser: User;
let normalUser: User;
let adminRole: Role;
let userRole: Role;
const PASSWORD = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'

describe('BidController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    jest.setTimeout(10000);
    module = await TestFactory.createTestModule();
    // Get roles
    adminRole = await module.repositories.roleRepository.findOne({ name: RoleEnum.ADMIN });
    userRole = await module.repositories.roleRepository.findOne({ name: RoleEnum.USER });

    // admin user
    adminUser = await module.repositories.userRepository.save({
      ...new User(),
      username: 'admin',
      email: 'bidvita-admin@isbx.com',
      password: PASSWORD,
      verified: true
    });

    // Create role to the user
    await module.repositories.userRoleRepository.saveUserRoles([[adminUser.id, adminRole.id]]);

    const adminToken = await module.services.tokenService.generateNewTokens({
      ...adminUser,
      roles: [adminRole]
    });
    adminAccessToken = adminToken.accessToken;

    // normal user
    normalUser = await module.repositories.userRepository.save({
      ...new User(),
      username: 'normal',
      email: 'bidvita-normal@isbx.com',
      password: PASSWORD,
      verified: true
    });
    // Create role to the user
    await module.repositories.userRoleRepository.saveUserRoles([[normalUser.id, userRole.id]]);

    const normalToken = await module.services.tokenService.generateNewTokens({
      ...normalUser,
      roles: [userRole]
    });
    normalAccessToken = normalToken.accessToken;

    const FILENAME = 'BIDVITA-VALUES_20201203_0853';
    const filePath = process.cwd() + '/templates/';
    const excelFile = await new Workbook().xlsx.readFile(`${filePath}${FILENAME}.xlsx`);
    const data = await excelFile.xlsx.writeBuffer();
    estimateData = await module.repositories.estimateDataRepository.save({
      name: FILENAME,
      data,
      deleted: false
    } as EstimateData);

    bid1 = await module.repositories.bidRepository.save({
      ...new Bid(),
      name: 'Bid 1',
      projectType: ProjectType.RETAIL,
      businessType: BusinessType.OWNER,
      plansUploaded: PlansUploaded.NO_UPLOAD,
      region: Region.NORTHERN_CALIFORNIA,
      user: normalUser,
      amepPlan: AMEPSheetsUpload.YES,
      mPlan: AMEPSheetsUpload.YES,
      ePlan: AMEPSheetsUpload.YES,
      pPlan: AMEPSheetsUpload.YES,
      estimateData
    });
    bidDetails1 = await module.services.bidService.saveDetails(bid1.id, {
      ...new ProjectDetailsDto(),
      squareFoot: 500,
      profitMargin: '5',
      workscope: Workscope.GROUND_UP,
      constructionType: ConstructionType.NEW_SHELL,
      buildingType: BuildingType.INSIDE_MALL,
      floor: FloorLevel.FIRST_FLOOR,
      storefront: StoreInfoType.NEW,
      acHvacUnits: AcHvacUnits.NEW,
      finishes: FinishesType.BASIC
    });
    await module.services.bidService.getEstimateCalculations(bid1.id);

    const deleteBid = await module.repositories.bidRepository.save({
      ...new Bid(),
      name: 'Deleted Bid',
      user: normalUser,
      estimateData
    });
    await module.services.bidService.saveDetails(deleteBid.id, {
      ...new ProjectDetailsDto(),
      squareFoot: 500,
      profitMargin: '5',
      finishes: FinishesType.BASIC
    });
    await module.services.bidService.getEstimateCalculations(deleteBid.id);
    deletedBid = await module.repositories.bidRepository.save({
      id: deleteBid.id,
      deleted: true
    });

    noBidEstimate = await module.repositories.bidRepository.save({
      ...new Bid(),
      name: 'Test Bid Pricing Edit - No estimate',
      projectType: ProjectType.OFFICE_SPACE,
      businessType: BusinessType.OWNER,
      plansUploaded: PlansUploaded.UPLOADED,
      region: Region.NORTHERN_CALIFORNIA,
      user: normalUser,
      amepPlan: 1,
      mPlan: 1,
      ePlan: 1,
      pPlan: 1,
      estimateData
    });

    await module.services.bidService.saveDetails(noBidEstimate.id, {
      squareFoot: 501,
      profitMargin: '7',
      workscope: Workscope.GROUND_UP,
      constructionType: ConstructionType.NEW_SHELL,
      buildingType: BuildingType.STRIP_CENTER,
      floor: FloorLevel.FIRST_FLOOR,
      storefront: StoreInfoType.EXISTING,
      acHvacUnits: AcHvacUnits.EXISTING,
      finishes: FinishesType.BASIC
    });
  });

  afterAll(async () => {
    // close DB connection after this module's tests
    await module.connection.close();
  });

  describe('#getAllOwned', () => {
    let bid2: Bid;
    let bid3: Bid;
    let bid4: Bid;

    beforeAll(async () => {
      bid2 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Bid 2',
        user: normalUser
      });

      bid3 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Bid 3',
        user: normalUser
      });

      bid4 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Bid 4',
        user: normalUser
      });

      const unownedBid = {
        ...new Bid(),
        name: 'Unowned Bid',
        user: adminUser
      };
      await module.repositories.bidRepository.save(unownedBid);
    });

    it('should return total number of owned bids', async () => {
      const response = await module.server
        .get('/api/bids/count')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);

      expect(response.text).toBe('5');
    });

    it('should receive the limit amount of records', async () => {
      const response = await module.server
        .get('/api/bids')
        .query({
          limit: 3,
          sort: 'id ASC'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should support sorting', async () => {
      const response = await module.server
        .get('/api/bids')
        .query({
          limit: 3,
          sort: 'name DESC'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);

      expect(response.body.length).toBe(3);
      expect(response.body[0].name).toBe(noBidEstimate.name);
      expect(response.body[1].name).toBe(bid4.name);
      expect(response.body[2].name).toBe(bid3.name);
    });
  });

  describe('#findById', () => {
    it('should return bid for owner', async () => {
      const retval = await module.server
        .get(`/api/bids/${bid1.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.id).toEqual(bid1.id);
    });
    it('should NOT return bid for non-owner', async () => {
      return await module.server
        .get(`/api/bids/${bid1.id}`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('should NOT return deleted bid', async () => {
      return await module.server
        .get(`/api/bids/${deletedBid.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
  describe('#create', () => {
    let newBid: ProjectCreateDto;

    beforeAll(async () => {
      const stateRetval = await module.server.get(`/api/states`);
      const state = stateRetval && (stateRetval.body as State[]).find(s => s.abbreviation === 'CA');

      newBid = {
        name: 'Create Bid',
        address: {
          addressLine1: 'Address line 1',
          addressLine2: 'Address line 2',
          city: 'City',
          zip: 'Zip',
          stateId: state.id
        },
        projectType: ProjectType.RETAIL,
        businessType: BusinessType.OWNER,
        region: Region.NORTHERN_CALIFORNIA,
        plansUploaded: PlansUploaded.NO_UPLOAD
      };
    });

    it('should create bid for authorized users', async () => {
      const retval = await module.server
        .post(`/api/bids`)
        .send(newBid)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const { body } = retval;
      expect(body.name).toEqual(newBid.name);
      expect(body.address).toBeDefined();
      expect(body.estimateData).toBeDefined();
    });
    it('should NOT create bid for everyone', async () => {
      return await module.server
        .post(`/api/bids`)
        .send(newBid)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
  describe('#update', () => {
    let savedBid: Bid;
    let bidUpdate: ProjectUpdateDto;
    const newAddressLine1 = 'New Address line 1';

    beforeAll(async () => {
      const stateRetval = await module.server.get(`/api/states`);
      const state = stateRetval && (stateRetval.body as State[]).find(s => s.abbreviation === 'CA');

      const address = await module.repositories.addressRepository.save({
        addressLine1: 'Address line 1',
        addressLine2: 'Address line 2',
        city: 'City',
        zip: 'Zip',
        state
      });

      savedBid = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Update Bid',
        user: normalUser,
        address
      });

      bidUpdate = {
        name: 'Updated Bid ' + random.alpha({ count: 5 }),
        address: {
          addressLine1: newAddressLine1
        } as AddressUpdateDto
      };
    });

    it('should update bid and bid address for owner', async () => {
      const retval = await module.server
        .patch(`/api/bids/${savedBid.id}`)
        .send(bidUpdate)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.name).toEqual(bidUpdate.name);
      expect(body.address.addressLine1).toEqual(newAddressLine1);
    });
    it('should NOT update bid for non-owner', async () => {
      await module.server
        .patch(`/api/bids/${savedBid.id}`)
        .send(bidUpdate)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
  describe('#delete', () => {
    let savedBid: Bid;

    beforeAll(async () => {
      savedBid = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Delete Bid',
        user: normalUser
      });
    });

    it('should delete bid for owner', async () => {
      await module.server
        .delete(`/api/bids/${savedBid.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      await module.server
        .get(`/api/bids/${savedBid.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('should NOT delete bid for non-owner', async () => {
      return await module.server
        .delete(`/api/bids/${savedBid.id}`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
  describe('#getDetails', () => {
    it('should return bid details for owner', async () => {
      const retval = await module.server
        .get(`/api/bids/${bid1.id}/details`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.id).toEqual(bidDetails1.id);
    });
    it('should NOT return bid details for non-owner', async () => {
      return await module.server
        .get(`/api/bids/${bid1.id}/details`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('should NOT return details for deleted bid', async () => {
      return await module.server
        .get(`/api/bids/${deletedBid.id}/details`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
  describe('#saveDetails', () => {
    let bidWithDetails: Bid;
    let bidDetailsUpdate: ProjectDetails;

    beforeAll(async () => {
      bidWithDetails = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Bid with Details',
        user: normalUser,
        estimateData
      });

      bidDetailsUpdate = {
        ...new ProjectDetails(),
        squareFoot: 500,
        profitMargin: '5',
        finishes: FinishesType.BASIC
      };
    });

    it('should NOT upsert bid details for non-owner', async () => {
      await module.server
        .post(`/api/bids/${bidWithDetails.id}/details`)
        .send(bidDetailsUpdate)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('should create bid details for owner', async () => {
      const retval = await module.server
        .post(`/api/bids/${bidWithDetails.id}/details`)
        .send(bidDetailsUpdate)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const { body } = retval;
      expect(body.squareFoot).toEqual(bidDetailsUpdate.squareFoot);
      expect(body.profitMargin).toEqual(bidDetailsUpdate.profitMargin);
    });
    it('should update bid details for owner', async () => {
      const { body: createdDetails } = await module.server
        .post(`/api/bids/${bidWithDetails.id}/details`)
        .send(bidDetailsUpdate)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const detailsUpdate = { ...bidDetailsUpdate, squareFoot: 1000, profitMargin: '0' };
      const retval = await module.server
        .post(`/api/bids/${bidWithDetails.id}/details`)
        .send(detailsUpdate)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const { body } = retval;
      expect(body.id).toEqual(createdDetails.id);
      expect(body.squareFoot).toEqual(detailsUpdate.squareFoot);
      expect(body.profitMargin).toEqual(detailsUpdate.profitMargin);
    });
    it('should NOT save details for deleted bid', async () => {
      return await module.server
        .post(`/api/bids/${deletedBid.id}/details`)
        .send(bidDetailsUpdate)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
  describe('#getBidEstimate', () => {
    it('ACL - should NOT allow $everyone to get bid estimate', async () => {
      return await module.server.get(`/api/bids/${bid1.id}/estimate`).expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT allow non-owner to get estimate for existing bid', async () => {
      return await module.server
        .get(`/api/bids/${bid1.id}/estimate`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT allow $authenticated to get estimate for non-existing bid', async () => {
      return await module.server
        .get('/api/bids/100/estimate')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT return details for deleted bid', async () => {
      return await module.server
        .get(`/api/bids/${deletedBid.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('ACL - should allow $authenticated to get estimate for an existing bid', async () => {
      const retval = await module.server
        .get(`/api/bids/${bid1.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.divisions).toBeDefined();
      expect(body.profitMargin).toBeDefined();
      expect(body.totalCost).toBeDefined();
      expect(body.daysToComplete).toBeDefined();
      expect(body.inspections).toBeDefined();
      expect(body.costPerSq).toBeDefined();
    });
  });
  describe('#getBidEstimate - from Excel results', () => {
    let testBid1: Bid;
    let testBid2: Bid;
    let testBid3: Bid;
    let testBid4: Bid;
    let testBid5: Bid;
    it('using sqFt 599', async () => {
      testBid1 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid',
        projectType: ProjectType.RETAIL,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.YES,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(testBid1.id, {
        squareFoot: 599,
        profitMargin: '3',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.HIGHRISE,
        floor: FloorLevel.SECOND_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.MEDIUM
      });

      await module.services.bidService.getEstimateCalculations(testBid1.id);

      const retval = await module.server
        .get(`/api/bids/${testBid1.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      expect(estimate.divisions.division_1).toBe(25126.1);
      expect(estimate.divisions.division_2).toBe(0);
      expect(estimate.divisions.division_3_4).toBe(1748.18);
      expect(estimate.divisions.division_5_7).toBe(19265.19);
      expect(estimate.divisions.division_8).toBe(120738.99);
      expect(estimate.divisions.division_9).toBe(2889.23);
      expect(estimate.divisions.division_10).toBe(62130.14);
      expect(estimate.divisions.division_11_12).toBe(4631.97);
      expect(estimate.divisions.division_13).toBe(11526.8);
      expect(estimate.divisions.division_15).toBe(35090.26);
      expect(estimate.divisions.division_15_1).toBe(15197.0);
      expect(estimate.divisions.division_16).toBe(46638.7);
      expect(estimate.profitMargin).toBe(10349.48);
      expect(estimate.totalCost).toBe(355332.03);
      expect(estimate.daysToComplete).toBe(46);

      expect(estimate.inspections.totalInspections).toBe(11);
      expect(estimate.inspections.roughInspections).toBe(4);
      expect(estimate.inspections.finalInspections).toBe(4);
      expect(estimate.inspections.fireDeptInspections).toBe(2);
      expect(estimate.inspections.greaseDuctInspections).toBe(0);
      expect(estimate.inspections.preHealthInspections).toBe(0);
      expect(estimate.inspections.finalHealthInspections).toBe(0);
      expect(estimate.inspections.finalBldgInspections).toBe(1);

      expect(estimate.costPerSq).toBe(593.21);
    });

    it('using sqFt 1234 - div 1 bug', async () => {
      const div1Bid = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Div 1 Bid',
        projectType: ProjectType.RETAIL,
        businessType: BusinessType.OWNER,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        plansUploaded: PlansUploaded.NO_UPLOAD,
        amepPlan: AMEPSheetsUpload.NO,
        mPlan: AMEPSheetsUpload.NO,
        ePlan: AMEPSheetsUpload.NO,
        pPlan: AMEPSheetsUpload.NO,
        estimateData
      });

      await module.services.bidService.saveDetails(div1Bid.id, {
        workscope: Workscope.GROUND_UP,
        constructionType: ConstructionType.RENOVATION_WITH_DEMOLITION,
        buildingType: BuildingType.STANDALONE_BLDG,
        floor: FloorLevel.FIRST_FLOOR,
        storefront: StoreInfoType.EXISTING,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.BASIC,
        squareFoot: 1234,
        profitMargin: '10'
      });

      await module.services.bidService.getEstimateCalculations(div1Bid.id);

      const retval = await module.server
        .get(`/api/bids/${div1Bid.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();

      /* eslint-disable @typescript-eslint/camelcase */
      expect(estimate.divisions).toEqual({
        division_1: 12623.01,
        division_2: 9473.28,
        division_3_4: 2721.9,
        division_5_7: 22080.91,
        division_8: 9623.2,
        division_9: 0.0,
        division_10: 35146.08,
        division_11_12: 5830.78,
        division_13: 12764.97,
        division_15: 0.0,
        division_15_1: 0.0,
        division_16: 0.0
      });

      expect(estimate.inspections).toEqual({
        totalInspections: 5,
        roughInspections: 1,
        finalInspections: 1,
        fireDeptInspections: 2,
        greaseDuctInspections: 0,
        preHealthInspections: 0,
        finalHealthInspections: 0,
        finalBldgInspections: 1
      });

      expect(estimate.profitMargin).toBe(11026.41);
      expect(estimate.totalCost).toBe(121290.55);
      expect(estimate.daysToComplete).toBe(27);
      expect(estimate.costPerSq).toBe(98.29);
    });

    it('using sqFt 1744 - div 16 DONT KNOW bugs', async () => {
      const div16Bid = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Div 16 Bid',
        projectType: ProjectType.RETAIL,
        businessType: BusinessType.OWNER,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        plansUploaded: PlansUploaded.UPLOADED,
        amepPlan: AMEPSheetsUpload.NO,
        mPlan: AMEPSheetsUpload.NO,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.NO,
        estimateData
      });

      await module.services.bidService.saveDetails(div16Bid.id, {
        workscope: null,
        constructionType: null,
        buildingType: null,
        floor: FloorLevel.FIRST_FLOOR,
        storefront: null,
        acHvacUnits: null,
        finishes: FinishesType.HIGHEND,
        squareFoot: 1744,
        profitMargin: ProfitMargin._0
      });

      await module.services.bidService.getEstimateCalculations(div16Bid.id);

      const retval = await module.server
        .get(`/api/bids/${div16Bid.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      /* eslint-disable @typescript-eslint/camelcase */
      expect(estimate.divisions).toEqual({
        division_1: 17853.35,
        division_2: 12607.19,
        division_3_4: 3726.99,
        division_5_7: 27547.86,
        division_8: 13176.67,
        division_9: 0.0,
        division_10: 86591.89,
        division_11_12: 7987.91,
        division_13: 16784.19,
        division_15: 0.0,
        division_15_1: 0.0,
        division_16: 86590.79
      });
      expect(estimate.profitMargin).toBe(0.0);
      expect(estimate.totalCost).toBe(272866.84);
      expect(estimate.inspections).toEqual({
        totalInspections: 7,
        roughInspections: 2,
        finalInspections: 2,
        fireDeptInspections: 2,
        greaseDuctInspections: 0,
        preHealthInspections: 0,
        finalHealthInspections: 0,
        finalBldgInspections: 1
      });

      expect(estimate.daysToComplete).toBe(32);
      expect(estimate.costPerSq).toBe(156.46);
    });

    it('using sqFt 3456', async () => {
      testBid2 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid',
        projectType: ProjectType.RETAIL,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.YES,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(testBid2.id, {
        squareFoot: 3456,
        profitMargin: '7',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.HIGHRISE,
        floor: FloorLevel.SECOND_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.MEDIUM
      });

      await module.services.bidService.getEstimateCalculations(testBid2.id);

      const retval = await module.server
        .get(`/api/bids/${testBid2.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      expect(estimate.divisions.division_1).toBe(73677.15);
      expect(estimate.divisions.division_2).toBe(0);
      expect(estimate.divisions.division_3_4).toBe(8900.08);
      expect(estimate.divisions.division_5_7).toBe(64333.5);
      expect(estimate.divisions.division_8).toBe(143495.79);
      expect(estimate.divisions.division_9).toBe(14714.46);
      expect(estimate.divisions.division_10).toBe(162073.17);
      expect(estimate.divisions.division_11_12).toBe(21476.01);
      expect(estimate.divisions.division_13).toBe(50905.98);
      expect(estimate.divisions.division_15).toBe(79021.17);
      expect(estimate.divisions.division_15_1).toBe(38036.2);
      expect(estimate.divisions.division_16).toBe(159830.56);
      expect(estimate.profitMargin).toBe(57152.49);
      expect(estimate.totalCost).toBe(873616.57);
      expect(estimate.daysToComplete).toBe(73);

      expect(estimate.inspections.totalInspections).toBe(11);
      expect(estimate.inspections.roughInspections).toBe(4);
      expect(estimate.inspections.finalInspections).toBe(4);
      expect(estimate.inspections.fireDeptInspections).toBe(2);
      expect(estimate.inspections.greaseDuctInspections).toBe(0);
      expect(estimate.inspections.preHealthInspections).toBe(0);
      expect(estimate.inspections.finalHealthInspections).toBe(0);
      expect(estimate.inspections.finalBldgInspections).toBe(1);

      expect(estimate.costPerSq).toBe(252.78);
    });

    it('using sqFt 5000', async () => {
      testBid3 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid',
        projectType: ProjectType.RESTAURANT,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.YES,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(testBid3.id, {
        squareFoot: 5000,
        profitMargin: '3',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.HIGHRISE,
        floor: FloorLevel.SECOND_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.MEDIUM
      });

      await module.services.bidService.getEstimateCalculations(testBid3.id);

      const retval = await module.server
        .get(`/api/bids/${testBid3.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      expect(estimate.divisions.division_1).toBe(122934.54);
      expect(estimate.divisions.division_2).toBe(0);
      expect(estimate.divisions.division_3_4).toBe(27543.64);
      expect(estimate.divisions.division_5_7).toBe(162968.48);
      expect(estimate.divisions.division_8).toBe(169578.4);
      expect(estimate.divisions.division_9).toBe(22993.47);
      expect(estimate.divisions.division_10).toBe(294096.7);
      expect(estimate.divisions.division_11_12).toBe(31710.69);
      expect(estimate.divisions.division_13).toBe(94631.37);
      expect(estimate.divisions.division_15).toBe(389594.34);
      expect(estimate.divisions.division_15_1).toBe(283333.73);
      expect(estimate.divisions.division_16).toBe(286378.94);
      expect(estimate.profitMargin).toBe(56572.93);
      expect(estimate.totalCost).toBe(1942337.24);
      expect(estimate.daysToComplete).toBe(108);

      expect(estimate.inspections.totalInspections).toBe(15);
      expect(estimate.inspections.roughInspections).toBe(4);
      expect(estimate.inspections.finalInspections).toBe(4);
      expect(estimate.inspections.fireDeptInspections).toBe(2);
      expect(estimate.inspections.greaseDuctInspections).toBe(2);
      expect(estimate.inspections.preHealthInspections).toBe(1);
      expect(estimate.inspections.finalHealthInspections).toBe(1);
      expect(estimate.inspections.finalBldgInspections).toBe(1);

      expect(estimate.costPerSq).toBe(388.47);
    });

    it('with mixed project details 1', async () => {
      testBid4 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid',
        projectType: ProjectType.OFFICE_SPACE,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.CENTRAL_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.NO,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.NO,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(testBid4.id, {
        squareFoot: 3200,
        profitMargin: '3',
        workscope: Workscope.GROUND_UP,
        constructionType: ConstructionType.RENOVATION_WITH_DEMOLITION,
        buildingType: BuildingType.INSIDE_MALL,
        floor: FloorLevel.THIRD_OR_HIGHER,
        storefront: StoreInfoType.EXISTING,
        acHvacUnits: AcHvacUnits.EXISTING,
        finishes: FinishesType.BASIC
      });

      await module.services.bidService.getEstimateCalculations(testBid4.id);

      const retval = await module.server
        .get(`/api/bids/${testBid4.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      expect(estimate.divisions.division_1).toBe(63796.86);
      expect(estimate.divisions.division_2).toBe(18195.4);
      expect(estimate.divisions.division_3_4).toBe(8434.79);
      expect(estimate.divisions.division_5_7).toBe(103698.67);
      expect(estimate.divisions.division_8).toBe(47000.79);
      expect(estimate.divisions.division_9).toBe(11956.34);
      expect(estimate.divisions.division_10).toBe(143291.13);
      expect(estimate.divisions.division_11_12).toBe(15262.84);
      expect(estimate.divisions.division_13).toBe(53070.8);
      expect(estimate.divisions.division_15).toBe(88653.78);
      expect(estimate.divisions.division_15_1).toBe(41065.06);
      expect(estimate.divisions.division_16).toBe(0);
      expect(estimate.profitMargin).toBe(17832.79);
      expect(estimate.totalCost).toBe(612259.27);
      expect(estimate.daysToComplete).toBe(54);
      expect(estimate.inspections.totalInspections).toBe(9);
      expect(estimate.inspections.roughInspections).toBe(3);
      expect(estimate.inspections.finalInspections).toBe(3);
      expect(estimate.inspections.fireDeptInspections).toBe(2);
      expect(estimate.inspections.greaseDuctInspections).toBe(0);
      expect(estimate.inspections.preHealthInspections).toBe(0);
      expect(estimate.inspections.finalHealthInspections).toBe(0);
      expect(estimate.inspections.finalBldgInspections).toBe(1);

      expect(estimate.costPerSq).toBe(191.33);
    });
    it('with mixed project details 2', async () => {
      testBid5 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid',
        projectType: ProjectType.GYM_FITNESS_CENTER,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.CENTRAL_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.NO,
        mPlan: AMEPSheetsUpload.NO,
        ePlan: AMEPSheetsUpload.NO,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(testBid5.id, {
        squareFoot: 1234,
        profitMargin: '10',
        workscope: Workscope.GROUND_UP,
        constructionType: ConstructionType.RENOVATION_WITH_DEMOLITION,
        buildingType: BuildingType.STANDALONE_BLDG,
        floor: FloorLevel.FIRST_FLOOR,
        storefront: StoreInfoType.EXISTING,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.BASIC
      });

      await module.services.bidService.getEstimateCalculations(testBid5.id);

      const retval = await module.server
        .get(`/api/bids/${testBid5.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const estimate = retval.body as ProjectEstimateDto;

      expect(estimate.divisions).toBeDefined();
      expect(estimate.divisions.division_1).toBe(14371.08);
      expect(estimate.divisions.division_2).toBe(6093.3);
      expect(estimate.divisions.division_3_4).toBe(5296.93);
      expect(estimate.divisions.division_5_7).toBe(24321.88);
      expect(estimate.divisions.division_8).toBe(7879.18);
      expect(estimate.divisions.division_9).toBe(3807.62);
      expect(estimate.divisions.division_10).toBe(35010.21);
      expect(estimate.divisions.division_11_12).toBe(7496.62);
      expect(estimate.divisions.division_13).toBe(11488.49);
      expect(estimate.divisions.division_15).toBe(0);
      expect(estimate.divisions.division_15_1).toBe(20058.2);
      expect(estimate.divisions.division_16).toBe(0);
      expect(estimate.profitMargin).toBe(13582.35);
      expect(estimate.totalCost).toBe(149405.86);
      expect(estimate.daysToComplete).toBe(29);

      expect(estimate.inspections.totalInspections).toBe(7);
      expect(estimate.inspections.roughInspections).toBe(2);
      expect(estimate.inspections.finalInspections).toBe(2);
      expect(estimate.inspections.fireDeptInspections).toBe(2);
      expect(estimate.inspections.greaseDuctInspections).toBe(0);
      expect(estimate.inspections.preHealthInspections).toBe(0);
      expect(estimate.inspections.finalHealthInspections).toBe(0);
      expect(estimate.inspections.finalBldgInspections).toBe(1);

      expect(estimate.costPerSq).toBe(121.07);
    });
  });
  describe('#calculateEstimate', () => {
    it('should generate estimates for owner', async () => {
      const retval = await module.server
        .post(`/api/bids/${bid1.id}/estimate`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const { body } = retval;
      expect(body.divisions).toBeDefined();
      expect(body.profitMargin).toBeDefined();
      expect(body.totalCost).toBeDefined();
      expect(body.daysToComplete).toBeDefined();
      expect(body.inspections).toBeDefined();
      expect(body.costPerSq).toBeDefined();
    });
    it('should NOT generate estimates for non-owner', async () => {
      return module.server
        .post(`/api/bids/${bid1.id}/estimate`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('#updateBidPlans', () => {
    it('should not allow non-owners to update bid plan values', async () => {
      await module.server
        .patch(`/api/bids/${bid1.id}/plans`)
        .send({
          amepPlan: AMEPSheetsUpload.NO,
          mPlan: AMEPSheetsUpload.YES,
          ePlan: AMEPSheetsUpload.NO,
          pPlan: AMEPSheetsUpload.YES
        })
        .expect(HttpStatus.FORBIDDEN);
    });
    it('should allow bid owners to update bid plan values', async () => {
      await module.server
        .patch(`/api/bids/${bid1.id}/plans`)
        .send({
          plansUploaded: PlansUploaded.UPLOADED,
          amepPlan: AMEPSheetsUpload.NO,
          mPlan: AMEPSheetsUpload.YES,
          ePlan: AMEPSheetsUpload.NO,
          pPlan: AMEPSheetsUpload.YES
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);
    });
  });

  describe('#getBidPlans', () => {
    it('should not allow non-owners to get bid plans', async () => {
      return await module.server.get(`/api/bids/${bid1.id}/plans`).expect(HttpStatus.FORBIDDEN);
    });
    it('should allow bid owners to update bid plans', async () => {
      const retval = await module.server
        .get(`/api/bids/${bid1.id}/plans`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const body = retval.body;
      expect(body.plans.length).toBe(0);
      expect(body.amepPlan).toBe(AMEPSheetsUpload.NO);
      expect(body.mPlan).toBe(AMEPSheetsUpload.YES);
      expect(body.ePlan).toBe(AMEPSheetsUpload.NO);
      expect(body.pPlan).toBe(AMEPSheetsUpload.YES);
    });
  });

  describe('#getBidPricing', () => {
    let bidPrice: Bid;
    beforeAll(async () => {
      bidPrice = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid Pricing',
        projectType: ProjectType.RESTAURANT,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.YES,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(bidPrice.id, {
        squareFoot: 600,
        profitMargin: '3',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.HIGHRISE,
        floor: FloorLevel.SECOND_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.MEDIUM
      });

      await module.services.bidService.getEstimateCalculations(bidPrice.id);
    });

    it('ACL - should NOT allow $everyone to get bid estimate', async () => {
      return await module.server.get(`/api/bids/${bidPrice.id}/pricing`).expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT allow non-owner to get pricing for existing bid', async () => {
      return await module.server
        .get(`/api/bids/${bidPrice.id}/pricing`)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT allow $authenticated to get pricing for non-existing bid', async () => {
      return await module.server
        .get('/api/bids/100/pricing')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('ACL - should NOT return pricing for deleted bid', async () => {
      return await module.server
        .get(`/api/bids/${deletedBid.id}/pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('ACL - should not allow $authenticated to get pricing for bids wo estimates', async () => {
      return await module.server
        .get(`/api/bids/${noBidEstimate.id}/pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(404);
    });
    it('ACL - should allow $authenticated to get new pricing for an existing bid', async () => {
      const retval = await module.server
        .get(`/api/bids/${bidPrice.id}/pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.pricing.lowCost).toBeDefined();
      expect(body.pricing.lowSchedule).toBeDefined();
      expect(body.mediumCost).toBeDefined();
      expect(body.pricing.highCost).toBeDefined();
      expect(body.pricing.highSchedule).toBeDefined();
      expect(body.pricing.goodCost).toBeDefined();
    });
  });
  describe('#getBidPricing - from Excel results', () => {
    let bidPrice2: Bid;
    beforeAll(async () => {
      bidPrice2 = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid Pricing',
        projectType: ProjectType.RESTAURANT,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.NORTHERN_CALIFORNIA,
        user: normalUser,
        amepPlan: AMEPSheetsUpload.YES,
        mPlan: AMEPSheetsUpload.YES,
        ePlan: AMEPSheetsUpload.YES,
        pPlan: AMEPSheetsUpload.YES,
        estimateData
      });

      await module.services.bidService.saveDetails(bidPrice2.id, {
        squareFoot: 1555,
        profitMargin: '7',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.INSIDE_MALL,
        floor: FloorLevel.SECOND_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.NEW,
        finishes: FinishesType.MEDIUM
      });
      await module.services.bidService.getEstimateCalculations(bidPrice2.id);
    });
    it('should allow $authenticated to get pricing from excel results', async () => {
      const retval = await module.server
        .get(`/api/bids/${bidPrice2.id}/pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const { body } = retval;
      expect(body.pricing.lowCost).toBe(646028.13);
      expect(body.pricing.lowSchedule).toBe(76);
      expect(body.mediumCost).toBe(778347.14);
      expect(body.mediumSchedule).toBe(66);
      expect(body.pricing.highCost).toBe(871748.8);
      expect(body.pricing.highSchedule).toBe(57);
      expect(body.pricing.goodCost).toBe(801697.55);
    });
  });

  describe('#updateBidPricing', () => {
    let updateBid: Bid;
    beforeAll(async () => {
      updateBid = await module.repositories.bidRepository.save({
        ...new Bid(),
        name: 'Test Bid Pricing Edit',
        projectType: ProjectType.RESTAURANT,
        businessType: BusinessType.OWNER,
        plansUploaded: PlansUploaded.UPLOADED,
        region: Region.CENTRAL_CALIFORNIA,
        user: normalUser,
        amepPlan: 1,
        mPlan: 1,
        ePlan: 1,
        pPlan: 1,
        estimateData
      });

      await module.services.bidService.saveDetails(updateBid.id, {
        squareFoot: 899,
        profitMargin: '3',
        workscope: Workscope.TENANT_IMPROVEMENT,
        constructionType: ConstructionType.NEW_SHELL,
        buildingType: BuildingType.INSIDE_MALL,
        floor: FloorLevel.FIRST_FLOOR,
        storefront: StoreInfoType.NEW,
        acHvacUnits: AcHvacUnits.EXISTING,
        finishes: FinishesType.HIGHEND
      });

      await module.services.bidService.getEstimateCalculations(updateBid.id);
      await module.services.bidService.getBidPricing(updateBid.id);
    });
    it('ACL - should not allow $everyone to update selected pricing ', async () => {
      return await module.server.patch(`/api/bids/${updateBid.id}/update-pricing`).expect(403);
    });

    it('ACL - should not allow $authenticated to update selected pricing without bid estimates', async () => {
      return await module.server
        .patch(`/api/bids/${noBidEstimate.id}/update-pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .send({ selected: BidPricingSelection.HIGH })
        .expect(404);
    });

    it('ACL - should not allow $authenticated to update selected pricing without bid estimates', async () => {
      const retval = await module.server
        .patch(`/api/bids/${updateBid.id}/update-pricing`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .send({ selected: BidPricingSelection.HIGH })
        .expect(200);

      const body = retval.body;
      expect(body.selected).toBe(BidPricingSelection.HIGH);
    });
  });
});
