import { model, Schema } from 'mongoose';

const imageSchema = new Schema(
  {
    url: String,
    status: { type: String, enum: ['processing', 'ready'] },
  },
  { _id: false },
);

const courseSchema = new Schema(
  { coverImage: imageSchema },
  { strict: false, collection: 'courses' },
);

const lessonSchema = new Schema(
  { images: [imageSchema] },
  { strict: false, collection: 'lessons' },
);

export const Course = model('WorkerCourse', courseSchema);
export const Lesson = model('WorkerLesson', lessonSchema);
