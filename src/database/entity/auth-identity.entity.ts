import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('auth_identities')
@Unique(['provider', 'provider_uid'])
export class AuthIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('varchar', { length: 32 })
  provider: string;

  @Column('varchar', { length: 128 })
  provider_uid: string;
}
