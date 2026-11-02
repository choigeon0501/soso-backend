import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './services/course.service';
import { CourseTransactionService } from './services/course-transaction.service';
import { CourseRepository } from './repositories/course.repository';
import { Course } from './entities/course.entity';
import { CourseShop } from './entities/course-shop.entity';
import { ShopModule } from '../shop/shop.module';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseShop]), ShopModule, AwsModule],
  controllers: [CourseController],
  providers: [CourseService, CourseTransactionService, CourseRepository],
})
export class CourseModule {}
