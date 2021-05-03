import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('estimate_data')
export class EstimateData {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name?: string;

  @Column({ type: 'blob' })
  public data: Buffer;

  @Column({ type: 'tinyint' })
  public deleted?: boolean;

  @CreateDateColumn({ type: 'datetime' })
  public created?: Date;

  @UpdateDateColumn({ name: 'modified', type: 'datetime' })
  public modified?: Date;
}
