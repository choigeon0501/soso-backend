import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('operating_hours')
export class OperatingHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 }) // 0: 확인 완료된 정보 1: 확인이 필요한 정보
  type: number;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  monday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  tuesday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  wednesday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  thursday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  friday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  saturday: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  sunday: boolean;

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @ManyToOne(() => (require('./shop.entity').Shop), (shop: any) => shop.operatingHours, { onDelete: 'CASCADE' })
  shop: any;
}
