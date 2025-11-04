import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Column } from 'typeorm';
import { User } from './user.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: User;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id', referencedColumnName: 'id' })
  shop: Shop;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
