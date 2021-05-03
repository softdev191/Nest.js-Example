import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', length: 5 })
  public abbreviation: string;

  @Column({ type: 'varchar', length: 32 })
  public name: string;

  @CreateDateColumn({ type: 'datetime' })
  public created: Date;

  @UpdateDateColumn({ name: 'modified', type: 'datetime' })
  public modified: Date;
}
