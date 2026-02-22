import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { ReviewBan } from '../../review/entities/review-ban.entity';
import { AuthIdentity } from '../../auth/entities/auth-identity.entity';

@Entity('users')
@Unique(['email'])
@Unique(['nickName'])
export class User {
  @PrimaryColumn('char', { length: 36 })
  uuid: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('varchar', { length: 512, nullable: true, name: 'profile_img' })
  profileImg: string;

  @Column('varchar', { length: 50, name: 'nickname', nullable: true })
  nickName: string;

  @Column({
    type: 'timestamp',
    name: 'last_activity_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivityAt: Date;

  @OneToMany(() => ReviewBan, (reviewBan) => reviewBan.user)
  reviewBans: ReviewBan[];

  @OneToMany(() => AuthIdentity, (authIdentity) => authIdentity.user)
  authIdentities: AuthIdentity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
