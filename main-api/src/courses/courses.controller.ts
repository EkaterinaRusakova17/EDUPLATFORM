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
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  findAll() {
    return this.courses.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.courses.create(dto, user.userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courses.update(id, dto, user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('teacher')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courses.remove(id, user.userId);
  }

  @Post(':id/enroll')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  enroll(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courses.enroll(id, user.userId);
  }
}
