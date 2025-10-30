import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Review } from './review.entity';
import { ReviewReportType } from '../../../common/enum/report.enum';

@Entity('review_reports')
export class ReviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uuid' })
  user: User;

  @ManyToOne(() => Review, (review) => review.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column({ name: 'report_type', type: 'varchar', length: 50 })
  reportType: ReviewReportType;

  @Column({ name: 'report_message', type: 'varchar', length: 255, nullable: true })
  reportMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
