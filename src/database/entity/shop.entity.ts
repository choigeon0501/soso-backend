import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Region } from './region.entity';
import { ShopOperatingHour } from './shop-operating-hour.entity';
import { ShopProductMapping } from './shop-product-mapping.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { name: 'main_image', length: 500, nullable: true })
  mainImage: string;

  @Column('tinyint', { name: 'is_verified', default: 0 })
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
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToMany(() => ShopOperatingHour, (oh) => oh.shop)
  operatingHours: ShopOperatingHour[];

  @OneToMany(() => ShopProductMapping, (mapping) => mapping.shop)
  productMappings: ShopProductMapping[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
