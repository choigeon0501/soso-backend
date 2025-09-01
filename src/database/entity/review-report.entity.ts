import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Review } from './review.entity';
import { ReviewReportType } from '../../common/enum/report.enum';

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

  @Column('enum', { name: 'report_type' })
  reportType: ReviewReportType;

  @Column('text', { name: 'report_message' })
  reportMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
