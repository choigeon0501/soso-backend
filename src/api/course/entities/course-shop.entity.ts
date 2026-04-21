import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Course } from './course.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('course_shops')
@Unique(['course', 'shop'])
@Index(['course', 'orderIndex'])
export class CourseShop {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, (course) => course.courseShops, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: Course;

  @ManyToOne(() => Shop, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'shop_id', referencedColumnName: 'id' })
  shop: Shop;

  @Column('int', { name: 'order_index' })
  orderIndex: number;

  @Column('timestamp', { name: 'visited_at', nullable: true })
  visitedAt: Date | null;
}
