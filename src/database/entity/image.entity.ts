import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Review } from './review.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  file_key: string;

  @ManyToMany(() => Review, (review) => review.images)
  reviews: Review[];
}
