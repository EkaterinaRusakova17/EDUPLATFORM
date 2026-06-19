import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const email = dto.email.toLowerCase();
        const existing = await this.userModel.exists({ email });
        if (existing) throw new ConflictException('Email is already registered');

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.userModel.create({
            name: dto.name,
            email,
            passwordHash,
            role: dto.role,
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async login(email: string, password: string) {
        const user = await this.userModel.findOne({ email: email.toLowerCase() });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const token = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        return { access_token: token };
    }
}
