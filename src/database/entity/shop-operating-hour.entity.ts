import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Shop } from './shop.entity';

@Entity('shop_operating_hours')
export class ShopOperatingHour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('tinyint', { name: 'is_verified', default: 0 })
  isVerified: boolean;

  @Column('varchar', { name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @Column('set', {
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    name: 'days_of_week',
  })
  daysOfWeek: string[];

  @Column('time', { name: 'start_time' })
  startTime: string;

  @Column('time', { name: 'end_time' })
  endTime: string;

  @ManyToOne(() => Shop, (shop) => shop.operatingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
