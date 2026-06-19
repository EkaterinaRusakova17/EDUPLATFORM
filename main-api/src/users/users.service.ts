import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async enroll(userId: string, courseId: string): Promise<boolean> {
    const result = await this.users.updateOne(
      { _id: userId, enrolledCourses: { $ne: courseId } },
      { $addToSet: { enrolledCourses: courseId } },
    );
    if (!result.matchedCount) {
      const exists = await this.users.exists({ _id: userId });
      if (!exists) throw new NotFoundException('User not found');
    }
    return result.modifiedCount === 1;
  }

  async removeCourseFromAll(courseId: string) {
    await this.users.updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } },
    );
  }
}
