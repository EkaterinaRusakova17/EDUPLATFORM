import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { Course } from '../courses/course.schema';
import { CoursesService } from '../courses/courses.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { Lesson } from './lesson.schema';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private readonly lessons: Model<Lesson>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    private readonly courseService: CoursesService,
    private readonly cache: CacheService,
  ) {}

  async findByCourse(courseId: string) {
    await this.courseService.findOne(courseId);
    return this.lessons.find({ courseId }).sort({ order: 1 }).lean();
  }

  async create(courseId: string, dto: CreateLessonDto, teacherId: string) {
    await this.courseService.requireOwner(courseId, teacherId);
    const lesson = await this.lessons.create({ ...dto, courseId, images: [] });
    await this.courses.updateOne(
      { _id: courseId },
      { $addToSet: { lessons: lesson.id } },
    );
    await this.courseService.invalidate(courseId);
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto, teacherId: string) {
    const lesson = await this.getDocument(id);
    await this.courseService.requireOwner(lesson.courseId, teacherId);
    Object.assign(lesson, dto);
    await lesson.save();
    await this.cache.del(`course:${lesson.courseId}`);
    return lesson;
  }

  async remove(id: string, teacherId: string) {
    const lesson = await this.getDocument(id);
    await this.courseService.requireOwner(lesson.courseId, teacherId);
    await Promise.all([
      lesson.deleteOne(),
      this.courses.updateOne(
        { _id: lesson.courseId },
        { $pull: { lessons: lesson.id } },
      ),
    ]);
    await this.courseService.invalidate(lesson.courseId);
    return { message: 'Lesson deleted' };
  }

  async getDocument(id: string): Promise<Lesson> {
    if (!isValidObjectId(id)) throw new NotFoundException('Lesson not found');
    const lesson = await this.lessons.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}
