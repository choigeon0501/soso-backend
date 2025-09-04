import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column, ManyToMany, JoinTable } from 'typeorm';

@Entity('review')
export class Review {
  @PrimaryGeneratedColumn()
  id: number; // 고유 ID

  @Column()
  content: string;

  @ManyToOne(() => (require('./user.entity').User), (user: any) => user.reviews, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  user: any;

  @ManyToOne(() => (require('./shop.entity').Shop), (shop: any) => shop.reviews, { onDelete: 'CASCADE' })
  shop: any;

  @ManyToMany(() => (require('./image.entity').Image), (image: any) => image.reviews, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'image_mapping',
  })
  images: any[];

  @CreateDateColumn()
  createdAt: Date;
}
