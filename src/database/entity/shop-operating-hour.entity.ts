import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Shop } from './shop.entity';

@Entity('shop_operating_hours')
export class ShopOperatingHour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('tinyint', { default: 0 })
  is_verified: boolean;

  @Column('varchar', { length: 20, nullable: true })
  phone_number: string;

  @Column('set', {
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  days_of_week: string[];

  @Column('time')
  start_time: string;

  @Column('time')
  end_time: string;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
