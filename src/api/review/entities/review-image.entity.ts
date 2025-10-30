import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Review } from './review.entity';

@Entity('review_images')
export class ReviewImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { name: 'file_key', length: 255 })
  fileKey: string;

  @ManyToMany(() => Review, (review) => review.images)
  reviews: Review[];
}
