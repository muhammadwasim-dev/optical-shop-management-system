import { IsDecimal, IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsDecimal({ decimal_digits: '0,2' })
  amount: string;

  @IsOptional()
  @IsISO8601()
  paidOn?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
