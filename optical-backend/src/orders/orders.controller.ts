import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('status') status?: string | string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const statusArr: OrderStatus[] = status
      ? (Array.isArray(status) ? status : [status]).filter((s) =>
          Object.values(OrderStatus).includes(s as OrderStatus),
        ) as OrderStatus[]
      : [];
    return this.ordersService.findAll({
      q,
      status: statusArr.length ? statusArr : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: { role: Role } },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  recordPayment(
    @Param('id') orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.ordersService.recordPayment(orderId, dto);
  }

  @Get(':id/payments')
  findPayments(@Param('id') orderId: string) {
    return this.ordersService.findPayments(orderId);
  }

  @Delete(':id/payments/:paymentId')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePayment(
    @Param('id') orderId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.ordersService.removePayment(orderId, paymentId);
  }
}
