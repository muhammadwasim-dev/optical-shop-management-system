import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

const STATUS_ORDER = [
  OrderStatus.CREATED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, contact: true } },
  prescription: true,
  payments: { orderBy: { paidOn: 'asc' as const } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const seqName = `order_seq_${year}`;
    await this.prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1`,
    );
    const rows = await this.prisma.$queryRawUnsafe<Array<{ seq: bigint }>>(
      `SELECT nextval('"${seqName}"') AS seq`,
    );
    const seq = Number(rows[0].seq);
    return `ORD-${year}-${seq.toString().padStart(4, '0')}`;
  }

  private enrich(order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>) {
    const totalPaid = order.payments.reduce(
      (s, p) => s.add(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );
    const totalAmount = new Prisma.Decimal(order.totalAmount);
    const balanceDue = totalAmount.sub(totalPaid);
    return {
      ...order,
      totalAmount: totalAmount.toFixed(2),
      payments: order.payments.map((p) => ({
        ...p,
        amount: new Prisma.Decimal(p.amount).toFixed(2),
      })),
      totalPaid: totalPaid.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
      isPaidInFull: balanceDue.lte(0),
    };
  }

  async create(dto: CreateOrderDto) {
    const { prescription, customerId, totalAmount, ...rest } = dto;

    if (
      prescription.rightCyl !== undefined &&
      prescription.rightCyl !== null &&
      prescription.rightAxis === undefined
    ) {
      throw new BadRequestException('rightAxis is required when rightCyl is set');
    }
    if (
      prescription.leftCyl !== undefined &&
      prescription.leftCyl !== null &&
      prescription.leftAxis === undefined
    ) {
      throw new BadRequestException('leftAxis is required when leftCyl is set');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const seqName = `order_seq_${year}`;
      await tx.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1`,
      );
      const rows = await tx.$queryRawUnsafe<Array<{ seq: bigint }>>(
        `SELECT nextval('"${seqName}"') AS seq`,
      );
      const seq = Number(rows[0].seq);
      const orderNumber = `ORD-${year}-${seq.toString().padStart(4, '0')}`;

      const rx = await tx.prescription.create({
        data: {
          customerId,
          pd: prescription.pd,
          type: prescription.type,
          writtenBy: prescription.writtenBy,
          writtenOn: prescription.writtenOn
            ? new Date(prescription.writtenOn)
            : null,
          rightSph:
            prescription.rightSph !== undefined
              ? new Prisma.Decimal(prescription.rightSph)
              : null,
          rightCyl:
            prescription.rightCyl !== undefined
              ? new Prisma.Decimal(prescription.rightCyl)
              : null,
          rightAxis: prescription.rightAxis ?? null,
          rightAdd:
            prescription.rightAdd !== undefined
              ? new Prisma.Decimal(prescription.rightAdd)
              : null,
          leftSph:
            prescription.leftSph !== undefined
              ? new Prisma.Decimal(prescription.leftSph)
              : null,
          leftCyl:
            prescription.leftCyl !== undefined
              ? new Prisma.Decimal(prescription.leftCyl)
              : null,
          leftAxis: prescription.leftAxis ?? null,
          leftAdd:
            prescription.leftAdd !== undefined
              ? new Prisma.Decimal(prescription.leftAdd)
              : null,
        },
      });

      return tx.order.create({
        data: {
          orderNumber,
          customerId,
          prescriptionId: rx.id,
          totalAmount: new Prisma.Decimal(totalAmount),
          ...rest,
        },
        include: ORDER_INCLUDE,
      });
    });

    return this.enrich(order);
  }

  async findAll(params: {
    q?: string;
    status?: OrderStatus[];
    page?: number;
    limit?: number;
  }) {
    const { q, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (status?.length) {
      where.status = { in: status };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((o) => this.enrich(o)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return this.enrich(order);
  }

  async update(id: string, dto: UpdateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { prescription: true } });
      if (!order) throw new NotFoundException(`Order ${id} not found`);

      if (dto.prescription) {
        const rx = dto.prescription;
        await tx.prescription.update({
          where: { id: order.prescriptionId },
          data: {
            ...(rx.type !== undefined && { type: rx.type }),
            ...(rx.pd !== undefined && { pd: rx.pd }),
            ...(rx.writtenBy !== undefined && { writtenBy: rx.writtenBy || null }),
            ...(rx.writtenOn !== undefined && { writtenOn: rx.writtenOn ? new Date(rx.writtenOn) : null }),
            ...(rx.rightSph !== undefined && { rightSph: rx.rightSph !== null ? new Prisma.Decimal(rx.rightSph) : null }),
            ...(rx.rightCyl !== undefined && { rightCyl: rx.rightCyl !== null ? new Prisma.Decimal(rx.rightCyl) : null }),
            ...(rx.rightAxis !== undefined && { rightAxis: rx.rightAxis }),
            ...(rx.rightAdd !== undefined && { rightAdd: rx.rightAdd !== null ? new Prisma.Decimal(rx.rightAdd) : null }),
            ...(rx.leftSph !== undefined && { leftSph: rx.leftSph !== null ? new Prisma.Decimal(rx.leftSph) : null }),
            ...(rx.leftCyl !== undefined && { leftCyl: rx.leftCyl !== null ? new Prisma.Decimal(rx.leftCyl) : null }),
            ...(rx.leftAxis !== undefined && { leftAxis: rx.leftAxis }),
            ...(rx.leftAdd !== undefined && { leftAdd: rx.leftAdd !== null ? new Prisma.Decimal(rx.leftAdd) : null }),
          },
        });
      }

      const { prescription: _rx, ...orderFields } = dto;
      const updated = await tx.order.update({
        where: { id },
        data: {
          ...(orderFields.frameDescription !== undefined && { frameDescription: orderFields.frameDescription }),
          ...(orderFields.lensType !== undefined && { lensType: orderFields.lensType }),
          ...(orderFields.coatings !== undefined && { coatings: orderFields.coatings }),
          ...(orderFields.totalAmount !== undefined && { totalAmount: new Prisma.Decimal(orderFields.totalAmount) }),
        },
        include: ORDER_INCLUDE,
      });
      return this.enrich(updated);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userRole: Role,
  ) {
    const order = await this.findOne(id);
    if (userRole === Role.WORKER) {
      const currentIdx = STATUS_ORDER.indexOf(order.status as OrderStatus);
      const newIdx = STATUS_ORDER.indexOf(dto.status);
      if (newIdx <= currentIdx) {
        throw new ForbiddenException(
          'Workers can only advance order status forward',
        );
      }
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: ORDER_INCLUDE,
    });
    return this.enrich(updated);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    // Deleting the Prescription cascades (via DB FK) to Order → then to Payments
    await this.prisma.prescription.delete({ where: { id: order.prescription.id } });
  }

  async recordPayment(orderId: string, dto: CreatePaymentDto) {
    await this.findOne(orderId);
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new ForbiddenException('Payment amount must be greater than 0');
    }
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method: dto.method,
        note: dto.note,
        ...(dto.paidOn && { paidOn: new Date(dto.paidOn) }),
      },
    });
    return {
      ...payment,
      amount: new Prisma.Decimal(payment.amount).toFixed(2),
    };
  }

  async findPayments(orderId: string) {
    await this.findOne(orderId);
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidOn: 'asc' },
    });
    return payments.map((p) => ({
      ...p,
      amount: new Prisma.Decimal(p.amount).toFixed(2),
    }));
  }

  async removePayment(orderId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.orderId !== orderId) {
      throw new NotFoundException(`Payment ${paymentId} not found on order ${orderId}`);
    }
    await this.prisma.payment.delete({ where: { id: paymentId } });
  }
}
