import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';

@Entity('submit_user_records')
export class SubmitUserRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('enum', { enum: ['initial_submission', 'operation_info_update', 'sales_info_update'] })
  type: string;

  @Column('enum', { enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Column('text', { nullable: true })
  reject_message: string;

  @Column('bigint', { nullable: true })
  operating_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
