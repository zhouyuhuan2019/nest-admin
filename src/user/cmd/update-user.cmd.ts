import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserCmd {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
