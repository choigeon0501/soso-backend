import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('region')
export class Region {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => (require('./shop.entity').Shop), (shop: any) => shop.region)
  shop: any;
}
