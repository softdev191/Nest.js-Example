import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../base/entities';
import { IsNotEmpty } from 'class-validator';
import { SubscriptionType } from '../enums';
import { SubscriptionStatus } from '../../bid/enums';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    () => User,
    user => user.subscriptions
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column({ nullable: true })
  public stripeSubscriptionId: string;

  @Column({ type: 'tinyint' })
  @IsNotEmpty()
  public type: SubscriptionType;

  @Column({ type: 'tinyint' })
  @IsNotEmpty()
  public status: SubscriptionStatus;

  @Column({ type: 'tinyint' })
  public isTrial: boolean;

  @Column({ type: 'tinyint' })
  public deleted: boolean;

  @Column({ name: 'exp_date', type: 'timestamp' })
  public expirationDate: Date;

  @Column({ type: 'timestamp' })
  public trialEndDate: Date;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
