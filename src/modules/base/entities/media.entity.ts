import { IsNotEmpty } from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @IsNotEmpty()
  public filename: string;

  @Column({ name: 'original_url' })
  public originalUrl: string;

  @Column({ name: 'small_url' })
  @IsNotEmpty()
  public smallUrl: string;

  @Column({ name: 'medium_url' })
  @IsNotEmpty()
  public mediumUrl: string;

  @Column({ name: 'large_url' })
  @IsNotEmpty()
  public largeUrl: string;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
