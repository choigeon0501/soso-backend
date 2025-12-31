import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Shop } from './shop.entity';
import { SubmitStatus, SubmitType } from '../../../common/enum/role.enum';
import { ShopOperatingHour } from './shop-operating-hour.entity';
import { ShopProductMapping } from './shop-product-mapping.entity';

@Entity('shop_submit_records')
export class ShopSubmitRecord {
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

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uuid' })
  user: User;

  @OneToMany(() => ShopProductMapping, (mapping) => mapping.submitRecord)
  shopProducts: ShopProductMapping[];

  @ManyToOne(() => ShopOperatingHour, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shop_operating_id' })
  shopOperatingHour: ShopOperatingHour | null;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
