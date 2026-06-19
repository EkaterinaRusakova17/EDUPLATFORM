import {
  Controller,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { UploadService } from './upload.service';

const storageRoot = process.env.STORAGE_DIR ?? join(process.cwd(), 'storage');
const originalsDir = join(storageRoot, 'originals');
mkdirSync(originalsDir, { recursive: true });

const uploadOptions = {
  storage: diskStorage({
    destination: originalsDir,
    filename: (_request: unknown, file: Express.Multer.File, callback: Function) => {
      const safeExtension = extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomUUID()}${safeExtension}`);
    },
  }),
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: Function,
  ) => {
    callback(
      file.mimetype.startsWith('image/')
        ? null
        : new Error('Only image files are allowed'),
      file.mimetype.startsWith('image/'),
    );
  },
};

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploads: UploadService,
    private readonly config: ConfigService,
  ) {}

  @Post('courses/:courseId/cover')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadCourseCover(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.uploads.uploadCourseCover(courseId, file, user.userId);
  }

  @Post('lessons/:lessonId/image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  uploadLessonImage(
    @Param('lessonId') lessonId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.uploads.uploadLessonImage(lessonId, file, user.userId);
  }

  @Get('images/:filename')
  getImage(@Param('filename') filename: string, @Res() response: Response) {
    const path = this.uploads.processedPath(filename);
    if (!existsSync(path)) throw new NotFoundException('Image not found');
    return response.sendFile(path);
  }
}
