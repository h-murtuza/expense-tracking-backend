import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ExpenseCategory, ExpenseStatus } from '../../common/enums';

export class GetExpensesQueryDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
