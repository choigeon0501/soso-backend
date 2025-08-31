import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_withdrawals')
export class UserWithdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 32 })
  reason_code: string;

  @Column('varchar', { length: 255, nullable: true })
  reason_text: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
