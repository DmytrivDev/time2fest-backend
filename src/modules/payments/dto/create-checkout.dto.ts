import { IsEmail } from 'class-validator';

export class CreateCheckoutDto {
  @IsEmail()
  email!: string;
}