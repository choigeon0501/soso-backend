import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Region } from './region.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 500, nullable: true })
  mainImage: string;

  @Column('tinyint', { default: 0 })
  isVerified: boolean;

  @Column('varchar', { length: 255, nullable: true })
  instagram: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lng: number;

  @Column('varchar', { length: 255, nullable: true })
  location: string;

  @ManyToOne(() => Region, (region) => region.shops, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'regionId' })
  region: Region;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
