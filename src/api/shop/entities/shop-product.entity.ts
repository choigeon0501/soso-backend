import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shop_products')
export class ShopProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
