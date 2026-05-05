import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionType } from '@prisma/client';

export class UpdatePrescriptionDto {
  @IsOptional()
  @IsEnum(PrescriptionType)
  type?: PrescriptionType;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(80)
  pd?: number;

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

  @IsOptional()
  @IsString()
  writtenBy?: string;

  @IsOptional()
  @IsISO8601()
  writtenOn?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  frameDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lensType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  coatings?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'totalAmount must be a non-negative decimal' })
  totalAmount?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePrescriptionDto)
  prescription?: UpdatePrescriptionDto;
}
