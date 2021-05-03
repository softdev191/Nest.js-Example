import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { State } from './state.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'address_line_1', type: 'varchar', length: 120 })
  public addressLine1: string;

  @Column({ name: 'address_line_2', type: 'varchar', length: 120 })
  public addressLine2?: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  public city: string;

  @OneToOne(() => State)
  @JoinColumn({ name: 'state_id' })
  public state: State;

  @Column({ name: 'zip', type: 'varchar', length: 16 })
  public zip: string;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
