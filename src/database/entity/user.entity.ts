import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique } from 'typeorm';

@Entity('users')
@Unique(['email'])
@Unique(['nick_name'])
export class User {
  @PrimaryColumn('char', { length: 36 })
  uuid: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('varchar', { length: 512, nullable: true })
  profile_img: string;

  @Column('varchar', { length: 50 })
  nick_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date;
}
