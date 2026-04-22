import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CourseShop } from './course-shop.entity';

@Entity('courses')
@Index(['user', 'createdAt'])
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'uuid', referencedColumnName: 'uuid' })
  user: User;

  @Column('varchar', { length: 30 })
  name: string;

  @Column('varchar', { length: 32, nullable: true, unique: true, name: 'share_token' })
  shareToken: string | null;

  @OneToMany(() => CourseShop, (courseShop) => courseShop.course)
  courseShops: CourseShop[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
