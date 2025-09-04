import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AuthProvider } from '../../common/enum/auth.enum';

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  uuid: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: '', nullable: true })
  photoUrl: string;

  @Column({
    unique: true,
    nullable: true,
  })
  nickName: string;

  @Column({ default: true })
  isNew: boolean;

  @Column({ type: 'enum', enum: AuthProvider })
  provider: AuthProvider;

  @OneToMany(() => (require('./wishlist.entity').Wishlist), (wishlist: any) => wishlist.user)
  wishlists: any[]; // 사용자가 소유한 위시리스트 목록

  @OneToMany(() => (require('./review.entity').Review), (review: any) => review.user)
  reviews: any[]; // 사용자가 소유한 위시리스트 목록

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date; // 생성 시간 자동 저장

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date; // 업데이트 시간 자동 갱신

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date | null; // 소프트 삭제 시간 (Soft Delete)

  @Column({ nullable: true })
  deleteType: number; // 0:앱을 자주 사용 ~...
}
