import { Entity, JoinColumn, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

import { User } from './user.entity';
import { Role } from './role.entity';

export enum RoleEnum {
  ADMIN = 'Admin',
  USER = 'User'
}

@Entity('user_role')
export class UserRole {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToMany(
    () => User,
    user => user.roles,
    {}
  )
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ManyToMany(
    () => Role,
    role => role.users,
    {}
  )
  @JoinColumn({ name: 'role_id' })
  public role: Role;
}
