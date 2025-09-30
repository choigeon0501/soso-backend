import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Shop } from './shop.entity';
import { SubmitStatus, SubmitType } from '../../common/enum/role.enum';
import { ShopOperatingHour } from './shop-operating-hour.entity';

@Entity('submit_user_records')
export class SubmitUserRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('enum', { enum: SubmitType })
  type: SubmitType;

  @Column('enum', { enum: SubmitStatus, default: SubmitStatus.Pending })
  status: SubmitStatus;

  @Column('text', { name: 'reject_message', nullable: true })
  rejectMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ShopOperatingHour, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shop_operating_id' })
  shopOperatingHour: ShopOperatingHour | null;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uuid' })
  user: User;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
