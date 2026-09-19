import { IsString, IsInt, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
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
  sellerId: number;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
