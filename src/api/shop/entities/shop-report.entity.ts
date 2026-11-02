import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Shop } from './shop.entity';
import { ShopReportType } from '../const/shop-report-type.const';

@Entity('shop_reports')
export class ShopReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uuid' })
  user: User;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ name: 'report_type', type: 'varchar', length: 50 })
  reportType: ShopReportType;

  @Column({ name: 'report_message', type: 'varchar', length: 255, nullable: true })
  reportMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
