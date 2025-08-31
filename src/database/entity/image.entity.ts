import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  file_key: string;
}
