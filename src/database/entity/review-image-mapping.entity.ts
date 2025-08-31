import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Review } from './review.entity';
import { Image } from './image.entity';

@Entity('review_image_mappings')
export class ReviewImageMapping {
  @PrimaryColumn()
  review_id: number;

  @PrimaryColumn()
  image_id: number;

  @ManyToOne(() => Review, (review) => review.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @ManyToOne(() => Image, (image) => image.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image: Image;
}
