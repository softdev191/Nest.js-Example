import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { AccountType, BusinessType, SubcontractorCategory } from '../../bid/enums';
import { User } from './user.entity';

@Entity('user_detail')
export class UserDetail {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  public user?: User;

  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column()
  public businessName?: string;

  @Column({ type: 'varchar', length: 30 })
  public phone?: string;

  @Column({ type: 'tinyint' })
  public businessType?: BusinessType;

  @Column({ type: 'tinyint' })
  public accountType?: AccountType;

  @Column({ type: 'tinyint' })
  public subContractorCategory?: SubcontractorCategory;

  @Column({ type: 'varchar', length: 255 })
  public subContractorName?: string; // possibly redundant to businessName

  @CreateDateColumn()
  public created?: Date;

  @UpdateDateColumn()
  public modified?: Date;
}
