import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, name: user.name, role: user.role, username: user.username },
    };
  }

  private async seedUsers() {
    const owner = await this.prisma.user.findUnique({ where: { username: 'owner' } });
    if (!owner) {
      await this.prisma.user.create({
        data: {
          name: 'Shop Owner',
          username: 'owner',
          password: await bcrypt.hash('owner123', 10),
          role: 'OWNER',
        },
      });
      console.log('Owner account seeded: username=owner, password=owner123');
    }

    const worker = await this.prisma.user.findUnique({ where: { username: 'worker' } });
    if (!worker) {
      await this.prisma.user.create({
        data: {
          name: 'Shop Worker',
          username: 'worker',
          password: await bcrypt.hash('worker123', 10),
          role: 'WORKER',
        },
      });
      console.log('Worker account seeded: username=worker, password=worker123');
    }
  }
}
