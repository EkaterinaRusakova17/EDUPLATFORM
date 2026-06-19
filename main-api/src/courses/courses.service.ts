import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { Lesson } from '../lessons/lesson.schema';
import { UsersService } from '../users/users.service';
import { Course } from './course.schema';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessons: Model<Lesson>,
    private readonly users: UsersService,
    private readonly cache: CacheService,
  ) {}

  async findAll() {
    const key = 'courses:all';
    const cached = await this.cache.get<unknown[]>(key);
    if (cached) return cached;

    const courses = await this.courses.find().sort({ createdAt: -1 }).lean();
    await this.cache.set(key, courses);
    return courses;
  }

  async findOne(id: string) {
    this.assertId(id);
    const key = `course:${id}`;
    const cached = await this.cache.get<Record<string, unknown>>(key);
    if (cached) return cached;

    const course = await this.courses.findById(id).lean();
    if (!course) throw new NotFoundException('Course not found');
    await this.cache.set(key, course);
    return course;
  }

  async create(dto: CreateCourseDto, teacherId: string) {
    const course = await this.courses.create({ ...dto, teacherId });
    await this.invalidate();
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, teacherId: string) {
    const course = await this.requireOwner(id, teacherId);
    Object.assign(course, dto);
    await course.save();
    await this.invalidate(id);
    return course;
  }

  async remove(id: string, teacherId: string) {
    await this.requireOwner(id, teacherId);
    await Promise.all([
      this.courses.deleteOne({ _id: id }),
      this.lessons.deleteMany({ courseId: id }),
      this.users.removeCourseFromAll(id),
    ]);
    await this.invalidate(id);
    return { message: 'Course deleted' };
  }

  async enroll(id: string, studentId: string) {
    const course = await this.getDocument(id);
    const enrolled = await this.users.enroll(studentId, id);
    if (enrolled) {
      course.studentsCount += 1;
      await course.save();
      await this.invalidate(id);
    }
    return { message: enrolled ? 'Enrolled successfully' : 'Already enrolled' };
  }

  async requireOwner(id: string, teacherId: string): Promise<Course> {
    const course = await this.getDocument(id);
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('Only the course owner may do this');
    }
    return course;
  }

  async invalidate(id?: string) {
    await this.cache.del('courses:all', ...(id ? [`course:${id}`] : []));
  }

  private async getDocument(id: string): Promise<Course> {
    this.assertId(id);
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private assertId(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Course not found');
  }
}
