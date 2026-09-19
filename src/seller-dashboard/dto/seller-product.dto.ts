import {
  IsString, IsInt, IsOptional, IsArray, IsBoolean, Min, IsNotEmpty,
} from 'class-validator';

export class CreateSellerProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  origPrice?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsInt()
  @Min(0)
  weight: number;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsOptional()
  @IsString()
  badge?: string;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSellerProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  origPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
