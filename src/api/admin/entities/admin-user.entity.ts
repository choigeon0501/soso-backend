import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_user')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;
}
