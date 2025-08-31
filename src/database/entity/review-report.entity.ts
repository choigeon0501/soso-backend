import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Review } from './review.entity';

@Entity('review_reports')
export class ReviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Review, (review) => review.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column('int')
  report_type: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  created_at: Date;
}
