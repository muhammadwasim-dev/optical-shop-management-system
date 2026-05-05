import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionType } from '@prisma/client';

export class PrescriptionInputDto {
  @IsOptional()
  @IsNumber()
  @Min(-20)
  @Max(20)
  rightSph?: number;

  @IsOptional()
  @IsNumber()
  @Min(-6)
  @Max(6)
  rightCyl?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  rightAxis?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  rightAdd?: number;

  @IsOptional()
  @IsNumber()
  @Min(-20)
  @Max(20)
  leftSph?: number;

  @IsOptional()
  @IsNumber()
  @Min(-6)
  @Max(6)
  leftCyl?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  leftAxis?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  leftAdd?: number;

  @IsInt()
  @Min(50)
  @Max(80)
  pd: number;

  @IsEnum(PrescriptionType)
  type: PrescriptionType;

  @IsOptional()
  @IsString()
  writtenBy?: string;

  @IsOptional()
  @IsISO8601()
  writtenOn?: string;
}

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @ValidateNested()
  @Type(() => PrescriptionInputDto)
  prescription: PrescriptionInputDto;

  @IsString()
  @MaxLength(500)
  frameDescription: string;

  @IsString()
  @MaxLength(200)
  lensType: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  coatings?: string;

  @IsDecimal({ decimal_digits: '0,2' })
  totalAmount: string;
}
