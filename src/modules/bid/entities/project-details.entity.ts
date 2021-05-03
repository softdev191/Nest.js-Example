import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Bid } from './bid.entity';

@Entity()
export class ProjectDetails {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => Bid)
  @JoinColumn({ name: 'bid_id' })
  public bid: Bid;

  @Column({ name: 'square_foot', type: 'int' })
  @IsNotEmpty()
  public squareFoot: number;

  @Column({ name: 'profit_margin', type: 'varchar', length: 5 })
  @IsNotEmpty()
  public profitMargin: string;

  @Column({ type: 'tinyint' })
  public workscope: number;

  @Column({ type: 'tinyint' })
  public constructionType: number;

  @Column({ name: 'building_type', type: 'tinyint' })
  public buildingType: number;

  @Column({ type: 'tinyint' })
  public floor: number;

  @Column({ type: 'varchar', length: 30 })
  public storefront: string;

  @Column({ name: 'ac_hvac_units', type: 'varchar', length: 30 })
  public acHvacUnits: string;

  @Column({ type: 'tinyint' })
  public finishes: number;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
