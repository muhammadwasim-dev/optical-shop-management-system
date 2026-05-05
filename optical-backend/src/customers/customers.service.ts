import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  findAll(search?: string) {
    if (!search) {
      return this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    }
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contact: { contains: search, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.customer.delete({ where: { id } });
    } catch (err: any) {
      const code = err?.code ?? err?.cause?.originalCode ?? '';
      // P2003 = Prisma FK error; 23001 = Postgres RESTRICT violation; 23503 = FK violation
      if (code === 'P2003' || code === '23001' || code === '23503') {
        throw new ConflictException(
          'Cannot delete customer who has orders. Delete their orders first.',
        );
      }
      throw err;
    }
  }
}
