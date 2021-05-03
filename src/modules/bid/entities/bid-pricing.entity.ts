import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Bid } from './bid.entity';
import { BidPricingSelection } from '../enums';
import { ColumnNumericTransformer } from '../transformers';

@Entity('bid_pricing')
export class BidPricing {
  @PrimaryGeneratedColumn() public id: number;

  @OneToOne(
    () => Bid,
    bid => bid.pricing
  )
  @JoinColumn({ name: 'bid_id' })
  public bid: Bid;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public lowCost: number;

  @Column({ type: 'int' })
  public lowSchedule: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public highCost: number;

  @Column({ type: 'int' })
  public highSchedule: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public goodCost: number;

  @Column({ type: 'tinyint', enum: BidPricingSelection, default: 0 })
  public selected: BidPricingSelection;

  @Column({ type: 'tinyint' })
  public deleted: boolean;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
