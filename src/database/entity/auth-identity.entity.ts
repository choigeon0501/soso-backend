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

  @Column('varchar', { name: 'provider_uid', length: 128 })
  providerUid: string;
}
