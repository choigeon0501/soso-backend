import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { WithdrawalReasonCode } from '../const/user-withdrawal-response-code.const.dt';

@Entity('user_withdrawals')
export class UserWithdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { name: 'reason_code', length: 32 })
  reasonCode: WithdrawalReasonCode;

  @Column('varchar', { name: 'reason_text', length: 255, nullable: true })
  reasonText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
