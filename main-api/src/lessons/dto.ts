import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
