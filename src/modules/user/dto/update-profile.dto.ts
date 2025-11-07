import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(60, { message: 'Name is too long' })
  name!: string;
}
