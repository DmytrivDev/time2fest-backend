import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(60, { message: 'Name is too long' })
  name?: string;

  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;
}
