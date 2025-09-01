import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';

@Entity('shop_reports')
export class ShopReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column('int')
  report_type: number;

  @Column('text')
  report_message: string;

  @CreateDateColumn()
  created_at: Date;
}
