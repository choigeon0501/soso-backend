import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmitRepository } from './submit.repository';
import { SubmitUserRecord } from 'src/database/entity/submit-user-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubmitUserRecord])],
  providers: [SubmitRepository],
  exports: [SubmitRepository],
})
export class SubmitModule {}
