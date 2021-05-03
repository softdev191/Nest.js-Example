import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { User } from '../../base/entities';
import { Subscription } from './subscription.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'stripe_payment_id' })
  public stripePaymentId: string;

  @ManyToOne(
    () => User,
    user => user.cards
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column()
  public brand: string;

  @Column()
  public name: string;

  @Column({ name: 'exp_month', type: 'tinyint', unsigned: true })
  @IsNotEmpty()
  public expMonth: number;

  @Column({ name: 'exp_year', type: 'smallint', unsigned: true })
  @IsNotEmpty()
  public expYear: number;

  @Column({ name: 'last_4' })
  public last4: string;

  @Column({ type: 'varchar' })
  @IsNotEmpty()
  public zipcode: string;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;

  @Column({ type: 'tinyint' })
  public deleted: boolean;
}
