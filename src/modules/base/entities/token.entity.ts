import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from './user.entity';

@Entity('token')
export class Token {
  @ApiProperty()
  @PrimaryColumn()
  public id: string;

  @ApiProperty()
  @Column()
  public expiration: Date;

  @ApiProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiProperty({ type: User })
  @ManyToOne(
    type => User,
    user => user.refreshTokens
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;
}
