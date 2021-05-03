import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from './user.entity';

@Entity()
export class Device {
  @ApiProperty()
  @PrimaryColumn()
  public id: string;

  @ApiProperty()
  @Column()
  public type: string;

  @ApiProperty()
  @Column()
  public token: string;

  @ApiProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiProperty({ type: User })
  @ManyToOne(
    type => User,
    user => user.devices
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;
}
