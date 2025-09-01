import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { Shop } from './shop.entity';
import { SubmitUserRecord } from './submit-user-record.entity';

@Entity('shop_product_mappings')
export class ShopProductMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('tinyint', { default: 0 })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Shop, (shop) => shop.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => SubmitUserRecord, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submit_record_id' })
  submit_record: SubmitUserRecord;
}
