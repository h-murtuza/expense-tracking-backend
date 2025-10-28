import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExpenseStatus } from '../../common/enums';

export class UpdateExpenseStatusDto {
  @IsEnum(ExpenseStatus)
  @IsNotEmpty()
  status: ExpenseStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
