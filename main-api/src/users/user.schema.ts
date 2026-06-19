import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class User extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ enum: ['student', 'teacher'], default: 'student' })
    role: 'student' | 'teacher';

    @Prop({ type: [String], default: [] })
    enrolledCourses: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
