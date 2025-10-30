import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, OneToMany } from 'typeorm';
import { ReviewBan } from '../../review/entities/review-ban.entity';

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

  @Column('varchar', { length: 50, name: 'nick_name', nullable: true })
  nickName: string;

  @OneToMany(() => ReviewBan, (reviewBan) => reviewBan.user)
  reviewBans: ReviewBan[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt: Date;
}
