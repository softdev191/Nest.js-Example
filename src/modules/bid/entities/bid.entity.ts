import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Media, User } from '../../base/entities';
import { Address } from './address.entity';
import { BusinessType, PlansUploaded, AMEPSheetsUpload, ProjectType, Region } from '../enums';
import { EstimateData } from './estimate-data.entity';
import { ProjectEstimate } from './project-estimates.entity';
import { Exclude } from 'class-transformer';
import { Plans } from './plans.entity';
import { BidPricing } from './bid-pricing.entity';

@Entity('bid')
export class Bid {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    () => User,
    user => user.bids
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column()
  public name: string;

  @OneToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  public address?: Address;

  @Column({ name: 'project_type', type: 'tinyint' })
  public projectType: ProjectType;

  @Column({ name: 'business_type', type: 'tinyint' })
  public businessType: BusinessType;

  @Column({ name: 'plansUploaded', type: 'enum', enum: PlansUploaded })
  @IsNotEmpty()
  public plansUploaded: PlansUploaded;

  @Column({ name: 'amep_plan', type: 'tinyint', enum: AMEPSheetsUpload, default: 0 })
  public amepPlan: AMEPSheetsUpload;

  @Column({ name: 'm_plan', type: 'tinyint', enum: AMEPSheetsUpload, default: 0 })
  public mPlan: AMEPSheetsUpload;

  @Column({ name: 'e_plan', type: 'tinyint', enum: AMEPSheetsUpload, default: 0 })
  public ePlan: AMEPSheetsUpload;

  @Column({ name: 'p_plan', type: 'tinyint', enum: AMEPSheetsUpload, default: 0 })
  public pPlan: AMEPSheetsUpload;

  @Column({ type: 'tinyint' })
  public region: Region;

  @OneToOne(() => Media)
  @JoinColumn({ name: 'media_id' })
  public media?: Media;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;

  @Column({ type: 'tinyint' })
  public deleted: boolean;

  /** Record of Excel file dataset used as reference data */
  @Exclude()
  @OneToOne(() => EstimateData, { eager: false })
  @JoinColumn({ name: 'estimate_data_id' })
  public estimateData?: EstimateData;

  @OneToMany(
    () => ProjectEstimate,
    projectEstimate => projectEstimate.bid
  )
  public estimates: ProjectEstimate[];

  @OneToMany(
    () => Plans,
    plans => plans.bid
  )
  public plans: Plans[];

  @OneToMany(
    () => BidPricing,
    pricing => pricing.bid
  )
  public pricing: BidPricing[];
}
