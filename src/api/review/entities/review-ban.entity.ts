import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('review_bans')
export class ReviewBan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.reviewBans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uuid' })
  user: User;

  @Column({ type: 'text', name: 'review_content' })
  reviewContent: string;

  @Column({ type: 'varchar', length: 50, name: 'ban_reason' })
  banReason: string;

  @Column({ type: 'datetime', name: 'ban_start_at' })
  banStartAt: Date;

  @Column({ type: 'datetime', name: 'ban_end_at' })
  banEndAt: Date;
}
