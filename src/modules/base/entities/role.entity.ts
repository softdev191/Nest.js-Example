import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { User } from './user.entity';

@Entity()
export class Role {
  @ApiProperty()
  @PrimaryColumn()
  public id: number;

  @ApiProperty()
  @Column()
  public name: string;

  @ApiProperty({ type: User, isArray: true })
  @ManyToMany(
    type => User,
    user => user.roles
  )
  public users: User[];
}
