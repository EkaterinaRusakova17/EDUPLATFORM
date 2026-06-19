import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CoursesModule } from './courses/courses.module';
import { KafkaModule } from './kafka/kafka.module';
import { LessonsModule } from './lessons/lessons.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/eduplatform',
        ),
      }),
    }),
    CacheModule,
    KafkaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    UploadModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
