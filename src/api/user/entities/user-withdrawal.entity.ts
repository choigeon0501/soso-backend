import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { WithdrawalReasonCode } from '../const/withdrawal-reason-code.const';

@Entity('user_withdrawals')
export class UserWithdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, nullable: true })
  uuid: string;

  @Column('varchar', { length: 50, name: 'nickname', nullable: true })
  nickName: string;

  @Column('varchar', { name: 'reason_code', length: 32 })
  reasonCode: WithdrawalReasonCode;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
