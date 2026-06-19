import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Course, CourseSchema } from '../courses/course.schema';
import { CoursesModule } from '../courses/courses.module';
import { Lesson, LessonSchema } from './lesson.schema';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [
    AuthModule,
    CoursesModule,
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
