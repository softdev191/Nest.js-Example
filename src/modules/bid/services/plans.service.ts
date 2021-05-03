import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Plans } from '../entities';
import { InjectRepository } from '../..';
import { Repository } from 'typeorm';
import { PlanCreateDto, ProjectPlanResponseDto } from '../dtos';
import { BidRepository } from '../repositories';

@Injectable()
export class PlansService {
  public constructor(
    @InjectRepository(Plans) private readonly plansRepository: Repository<Plans>,
    private readonly bidRepository: BidRepository
  ) {}

  public async createPlan(plans: PlanCreateDto): Promise<Plans> {
    const { bidId } = plans;
    try {
      const bid = await this.bidRepository.findOne({ id: bidId, deleted: false });
      return this.plansRepository.save({ ...plans, bid });
    } catch (err) {
      throw new BadRequestException();
    }
  }

  public async getBidPlans(id: number): Promise<ProjectPlanResponseDto> {
    const bid = await this.bidRepository.findById(id);
    if (!bid) {
      throw new NotFoundException();
    }
    const plans = await this.plansRepository.find({ bid: { id }, deleted: false });
    const plansVal = { amepPlan: bid.amepPlan, mPlan: bid.mPlan, ePlan: bid.ePlan, pPlan: bid.pPlan };
    return { plans, ...plansVal };
  }

  public async deleteBidPlans(bidId: number, planId: number): Promise<Plans> {
    const bid = await this.bidRepository.findById(bidId);
    if (!bid) {
      throw new NotFoundException();
    }
    console.log(planId);
    const plan = await this.plansRepository.findOne({ where: { id: planId, bid: { id: bidId }, deleted: false } });
    await this.plansRepository.update(plan, { deleted: true });
    return plan;
  }
}
