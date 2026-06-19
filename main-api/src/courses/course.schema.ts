import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Course extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    teacherId: string;

    @Prop({
        type: {
            url: String,
            status: { type: String, enum: ['processing', 'ready'], default: 'processing' },
        },
        default: null,
    })
    coverImage: {
        url: string;
        status: 'processing' | 'ready';
    } | null;

    @Prop({ type: [String], default: [] })
    lessons: string[];

    @Prop({ default: 0 })
    studentsCount: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
