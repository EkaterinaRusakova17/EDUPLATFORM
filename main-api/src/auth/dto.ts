import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['student', 'teacher'])
  role: 'student' | 'teacher';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
