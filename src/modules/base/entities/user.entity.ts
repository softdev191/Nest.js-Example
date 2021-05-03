import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, MinLength, IsMobilePhone } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Token } from './token.entity';
import { Device } from './device.entity';
import { Media } from './media.entity';
import { Role } from './role.entity';
import { Bid } from '../../bid/entities';
import { Card, Subscription } from '../../billing/entities';
import { BillingStatus } from '../../bid/enums';
import { UserDetail } from './user-detail.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @IsNotEmpty()
  public username: string;

  @Column({ select: true })
  @IsEmail()
  public email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  @MinLength(8)
  public password: string;

  @Column()
  public verified: boolean;

  @Column()
  public deleted: boolean;

  @Column()
  public stripeCustomerId: string;

  @Column({ name: 'billing_status', type: 'tinyint' })
  public billingStatus: number = BillingStatus.INACTIVE;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;

  public isFollowing: boolean;

  @OneToOne(() => UserDetail, {
    eager: true
  })
  @JoinColumn({ name: 'user_detail_id' })
  public userDetail: UserDetail;

  @OneToOne(() => Media, {
    eager: true
  })
  @JoinColumn({ name: 'profile_media_id' })
  public profileMedia: Media;

  @OneToMany(
    () => Token,
    refreshToken => refreshToken.user
  )
  public refreshTokens: Token[];

  @OneToMany(
    () => Device,
    device => device.user
  )
  public devices: Device[];

  @ManyToMany(
    () => Role,
    role => role.users,
    {
      eager: true
    }
  )
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' }
  })
  public roles: Role[];

  @OneToMany(
    () => Card,
    card => card.user
  )
  public cards: Card[];

  @OneToMany(
    () => Subscription,
    subscriptions => subscriptions.user
  )
  public subscriptions: Subscription[];

  @OneToMany(
    () => Bid,
    bids => bids.user
  )
  public bids: Bid[];
}
