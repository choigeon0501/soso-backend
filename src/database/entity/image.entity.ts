import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Review } from './review.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { name: 'file_key', length: 255 })
  fileKey: string;

  @ManyToMany(() => Review, (review) => review.images)
  reviews: Review[];
}
