import { IsString, IsNotEmpty, IsBoolean } from "class-validator";

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsBoolean()
  @IsNotEmpty()
  policy!: boolean;
}
