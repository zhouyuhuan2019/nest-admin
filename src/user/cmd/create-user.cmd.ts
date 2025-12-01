import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserCmd {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
