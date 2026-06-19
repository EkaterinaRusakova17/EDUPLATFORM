import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Lesson extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    content: string;

    @Prop({ required: true })
    courseId: string;

    @Prop({
        type: [{
            url: String,
            status: { type: String, enum: ['processing', 'ready'], default: 'processing' },
        }],
        default: [],
    })
    images: Array<{
        url: string;
        status: 'processing' | 'ready';
    }>;

    @Prop({ required: true, min: 1 })
    order: number;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
