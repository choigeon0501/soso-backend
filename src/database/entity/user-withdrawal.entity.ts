import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
}
