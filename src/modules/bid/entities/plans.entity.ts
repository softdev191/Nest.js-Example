import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Bid } from './bid.entity';

@Entity('plans')
export class Plans {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', length: 1024 })
  public filename: string;

  @Column({ type: 'varchar', length: 1024 })
  public url: string;

  @Column({ type: 'tinyint' })
  public deleted: boolean;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;

  @ManyToOne(
    () => Bid,
    bid => bid.plans
  )
  @JoinColumn({ name: 'bid_id' })
  public bid: Bid;
}
