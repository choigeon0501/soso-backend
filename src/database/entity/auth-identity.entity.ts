import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { AuthProvider } from '../../common/enum/auth.enum';

@Entity('auth_identities')
@Unique(['provider', 'providerUid'])
export class AuthIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('varchar', { length: 32 })
  provider: AuthProvider;

  @Column('varchar', { name: 'provider_uid', length: 128 })
  providerUid: string;
}
