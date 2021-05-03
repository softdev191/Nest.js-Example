import { Res, Controller, Post, Get, Body, Param, ParseIntPipe, Patch, Query, Delete, Header } from '@nestjs/common';
import { UpdateResult } from 'typeorm';

import { AuthenticatedRole, EveryoneRole } from '../../base/roles';
import { BidOwnerRole } from '../guards/bid-owner-role';
import { CurrentUser, Roles } from '../../../decorators';
import { User } from '../../base/entities';
import { Bid, BidPricing, Plans, ProjectDetails } from '../entities';
import {
  ProjectEstimateDto,
  ProjectDetailsDto,
  ProjectCreateDto,
  ProjectUpdateDto,
  BidCostDto,
  ProjectPlanUpdateDto,
  ProjectPlanResponseDto,
  ProjectPlanDeleteDto,
  ProjectCoverParams,
  BidPricingDto,
  BidPricingUpdateDto
} from '../dtos';
import { BidService, PlansService } from '../services';
import { SearchParamsDto } from '../../base/dtos';

@Controller('bids')
export class BidController {
  public constructor(private readonly bidService: BidService, private readonly planService: PlansService) {}

  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)')
  public async findById(@Param('id', ParseIntPipe) id: number): Promise<Bid> {
    return this.bidService.findById(id);
  }

  @Roles(AuthenticatedRole)
  @Get()
  public async getAllOwned(
    @CurrentUser()
    currentUser: User,
    @Query() searchParams: SearchParamsDto
  ): Promise<BidCostDto[]> {
    return this.bidService.getAllOwned(currentUser.id, searchParams);
  }

  @Roles(AuthenticatedRole)
  @Get('count')
  public async getOwnedCount(
    @CurrentUser()
    currentUser: User
  ): Promise<number> {
    return this.bidService.getOwnedCount(currentUser.id);
  }

  @Roles(AuthenticatedRole)
  @Post()
  public async create(
    @CurrentUser()
    currentUser: User,
    @Body() bid: ProjectCreateDto
  ): Promise<Bid> {
    return this.bidService.create(bid, currentUser);
  }

  @Roles(BidOwnerRole)
  @Patch(':id([0-9]+)')
  public async update(@Param('id', ParseIntPipe) id: number, @Body() bid: ProjectUpdateDto): Promise<Bid> {
    bid.id = id;
    return this.bidService.update(bid);
  }

  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/details')
  public async getDetails(@Param('id', ParseIntPipe) bidId: number): Promise<ProjectDetails> {
    return this.bidService.getDetails(bidId);
  }

  @Roles(BidOwnerRole)
  @Post(':id([0-9]+)/details')
  public async saveDetails(
    @Param('id', ParseIntPipe) bidId: number,
    @Body() details: ProjectDetailsDto
  ): Promise<ProjectDetails> {
    return this.bidService.saveDetails(bidId, details);
  }

  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/estimate')
  public async getEstimate(@Param('id', ParseIntPipe) bidId: number): Promise<ProjectEstimateDto> {
    return this.bidService.getEstimate(bidId);
  }

  @Roles(BidOwnerRole)
  @Post(':id([0-9]+)/estimate')
  public async calculateEstimate(@Param('id', ParseIntPipe) bidId: number): Promise<ProjectEstimateDto> {
    return this.bidService.getEstimateCalculations(bidId);
  }

  @Roles(BidOwnerRole)
  @Delete(':id([0-9]+)')
  public async remove(@Param('id', ParseIntPipe) id: number): Promise<UpdateResult> {
    return this.bidService.remove(id);
  }

  /** Downloads the Excel file dataset used by this bid. */
  @Roles(BidOwnerRole) // TODO: guard with AdminRole after testing phase. Make sure to include `token` query.
  @Get(':id([0-9]+)/estimate-data')
  public async getBidEstimateDataFile(@Param('id', ParseIntPipe) id: number, @Res() res): Promise<void> {
    return this.bidService.getEstimateDataFile(id, res);
  }

  /** Downloads the estimate bid PDF file. */
  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/export-estimate')
  @Header('Content-type', 'application/pdf')
  public async downloadBidEstimatePDF(@Param('id', ParseIntPipe) id: number, @Res() res): Promise<void> {
    return this.bidService.downloadBidEstimatePDF(id, res);
  }

  /** Downloads the estimate bid PDF file. */
  @Roles(AuthenticatedRole)
  @Get('preview-cover')
  @Header('Content-type', 'application/pdf')
  public async downloadBidCoverPDF(@Query() coverParams: ProjectCoverParams, @Res() res): Promise<void> {
    return this.bidService.downloadBidCoverPDF(coverParams, res);
  }

  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/plans')
  public async getBidPlans(@Param('id', ParseIntPipe) id: number): Promise<ProjectPlanResponseDto> {
    return this.planService.getBidPlans(id);
  }

  @Roles(BidOwnerRole)
  @Patch(':id([0-9]+)/plans')
  public async updateBidPlans(
    @Param('id', ParseIntPipe) id: number,
    @Body() plans: ProjectPlanUpdateDto
  ): Promise<Bid> {
    return this.bidService.updatePlans(id, plans);
  }

  @Roles(BidOwnerRole)
  @Patch(':id([0-9]+)/delete-plan')
  public async deleteBidPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ProjectPlanDeleteDto
  ): Promise<Plans> {
    return this.planService.deleteBidPlans(id, body.planId);
  }

  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/pricing')
  public async getBidPricing(@Param('id', ParseIntPipe) bidId: number): Promise<BidPricingDto> {
    return this.bidService.getBidPricing(bidId);
  }

  @Roles(BidOwnerRole)
  @Patch(':id([0-9]+)/update-pricing')
  public async updateBidPricing(
    @Param('id', ParseIntPipe) bidId: number,
    @Body() data: BidPricingUpdateDto
  ): Promise<BidPricing> {
    return this.bidService.updateBidPricing(bidId, data);
  }

  /** Downloads the bid pricing in excel file. */
  @Roles(BidOwnerRole)
  @Get(':id([0-9]+)/export-pricing')
  @Header('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  public async downloadBidPricingXLS(@Param('id', ParseIntPipe) id: number, @Res() res): Promise<void> {
    return this.bidService.downloadBidPricingXLS(id, res);
  }

  /** Downloads bid plans in zip. */
  @Roles(AuthenticatedRole)
  @Get(':id([0-9]+)/download-plans')
  @Header('Content-type', 'application/zip')
  public async downloadBidPlans(@Param('id', ParseIntPipe) id: number, @Res() res): Promise<void> {
    return this.bidService.downloadBidPlans(id, res);
  }
}
