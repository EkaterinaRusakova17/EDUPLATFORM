import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { basename, extname, join, parse } from 'path';
import { Course } from '../courses/course.schema';
import { CoursesService } from '../courses/courses.service';
import { KafkaProducer } from '../kafka/kafka.producer';
import { Lesson } from '../lessons/lesson.schema';
import { LessonsService } from '../lessons/lessons.service';

@Injectable()
export class UploadService {
  private readonly storageDir: string;

  constructor(
    config: ConfigService,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessons: Model<Lesson>,
    private readonly courseService: CoursesService,
    private readonly lessonService: LessonsService,
    private readonly kafka: KafkaProducer,
  ) {
    this.storageDir = config.get<string>('STORAGE_DIR', join(process.cwd(), 'storage'));
  }

  async uploadCourseCover(
    courseId: string,
    file: Express.Multer.File,
    teacherId: string,
  ) {
    await this.courseService.requireOwner(courseId, teacherId);
    const image = this.imageMetadata(file.filename);
    await this.courses.updateOne({ _id: courseId }, { coverImage: image.dbValue });
    await this.courseService.invalidate(courseId);
    await this.queue('course', courseId, courseId, file, image);
    return image.dbValue;
  }

  async uploadLessonImage(
    lessonId: string,
    file: Express.Multer.File,
    teacherId: string,
  ) {
    const lesson = await this.lessonService.getDocument(lessonId);
    await this.courseService.requireOwner(lesson.courseId, teacherId);
    const image = this.imageMetadata(file.filename);
    await this.lessons.updateOne(
      { _id: lessonId },
      { $push: { images: image.dbValue } },
    );
    await this.queue('lesson', lessonId, lesson.courseId, file, image);
    return image.dbValue;
  }

  processedPath(filename: string) {
    return join(this.storageDir, 'processed', basename(filename));
  }

  private imageMetadata(filename: string) {
    const outputFilename = `${parse(filename).name}.webp`;
    const url = `/upload/images/${outputFilename}`;
    return {
      outputFilename,
      dbValue: { url, status: 'processing' as const },
    };
  }

  private async queue(
    entityType: 'course' | 'lesson',
    entityId: string,
    courseId: string,
    file: Express.Multer.File,
    image: ReturnType<UploadService['imageMetadata']>,
  ) {
    await this.kafka.send('image.uploaded', {
      entityType,
      entityId,
      courseId,
      inputFilename: basename(file.filename),
      outputFilename: image.outputFilename,
      imageUrl: image.dbValue.url,
      originalExtension: extname(file.originalname),
    });
  }
}
