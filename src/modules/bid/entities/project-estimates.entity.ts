import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { ColumnNumericTransformer } from '../../base/transformers/column-numeric.transformer';
import { Bid } from './bid.entity';

@Entity('project_estimates')
export class ProjectEstimate {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(
    () => Bid,
    bid => bid.estimates
  )
  @JoinColumn({ name: 'bid_id' })
  public bid: Bid;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_1: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_2: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_3_4: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_5_7: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_8: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_9: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_10: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_11_12: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_13: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_15: number;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_15_1: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public division_16: number;

  @Column({
    name: 'profit_margin',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public profitMargin: number;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public totalCost: number;

  @Column({ name: 'days_to_complete', type: 'int', transformer: new ColumnNumericTransformer() })
  public daysToComplete: number;

  @Column({
    name: 'cost_per_sq',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer()
  })
  public costPerSq: number;

  @Column({ name: 'total_inspections' })
  public totalInspections: number;

  @Column({ name: 'rough_inspections' })
  public roughInspections: number;

  @Column({ name: 'final_inspections' })
  public finalInspections: number;

  @Column({ name: 'grease_duct_inspections' })
  public greaseDuctInspections: number;

  @Column({ name: 'pre_health_inspections' })
  public preHealthInspections: number;

  @Column({ name: 'final_bldg_inspections' })
  public finalBldgInspections: number;

  @Column({ name: 'fire_dept_inspections' })
  public fireDeptInspections: number;

  @Column({ name: 'final_health_inspections' })
  public finalHealthInspections: number;

  @Column({ type: 'tinyint' })
  public deleted: boolean;

  @CreateDateColumn({ type: 'datetime' })
  public created: Date;

  @UpdateDateColumn({ name: 'modified', type: 'datetime' })
  public modified: Date;
}

// totalInspections,
//   roughInspection,
//   finalInspection,
//   greaseDuctInspection,
//   preHealthInspection,
//   finalBldgInspection,
//   fireDeptInspection,
//   finalHealthInspection
