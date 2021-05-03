import { CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User, {
    eager: true
  })
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @OneToOne(() => User, {
    eager: true
  })
  @JoinColumn({ name: 'reporter_id' })
  public reporter: User;

  @CreateDateColumn()
  public created: Date;
}
