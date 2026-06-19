import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Course, CourseSchema } from '../courses/course.schema';
import { CoursesModule } from '../courses/courses.module';
import { Lesson, LessonSchema } from '../lessons/lesson.schema';
import { LessonsModule } from '../lessons/lessons.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    AuthModule,
    CoursesModule,
    LessonsModule,
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Lesson.name, schema: LessonSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
