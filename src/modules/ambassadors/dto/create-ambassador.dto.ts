import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateAmbassadorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  age!: string;

  @IsString()
  @IsNotEmpty()
  contactMethod!: string;

  @IsString()
  @IsNotEmpty()
  contactLink!: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>; // Instagram: "link", TikTok: "link" тощо

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  englishLevel?: string;

  @IsString()
  @IsOptional()
  streamLang?: string;

  @IsString()
  @IsNotEmpty()
  motivation!: string;

  @IsBoolean()
  @IsNotEmpty()
  policy!: boolean;
}
