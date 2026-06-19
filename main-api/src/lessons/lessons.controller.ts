import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateLessonDto, UpdateLessonDto } from './dto';
import { LessonsService } from './lessons.service';

@Controller()
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get('courses/:courseId/lessons')
  findByCourse(@Param('courseId') courseId: string) {
    return this.lessons.findByCourse(courseId);
  }

  @Post('courses/:courseId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessons.create(courseId, dto, user.userId);
  }

  @Patch('lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessons.update(id, dto, user.userId);
  }

  @Delete('lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.lessons.remove(id, user.userId);
  }
}
