import { Entity, ManyToOne, Column, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_mapping')
export class ProductMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  shopId: number;

  @Column({ type: 'int', default: 0 })
  type: number; // 0: 실제 사용중 , 1: 제안

  @Column({ default: 'admin' })
  user: string;

  @ManyToOne(() => (require('./product.entity').Product), { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' }) // productId를 Product의 id와 연결
  product: any;

  @ManyToOne(() => (require('./shop.entity').Shop), { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shopId' }) // shopId를 Shop의 id와 연결
  shop: any;
}
