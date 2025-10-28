import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseStatusDto,
  GetExpensesQueryDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.id, createExpenseDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any, @Query() query: GetExpensesQueryDto) {
    return this.expensesService.findAll(user.id, user.role, query);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPendingExpenses() {
    return this.expensesService.getPendingExpenses();
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics(@CurrentUser() user: any) {
    return this.expensesService.getAnalytics(user.id, user.role);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateExpenseStatusDto: UpdateExpenseStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.expensesService.updateStatus(
      id,
      updateExpenseStatusDto,
      user.id,
    );
  }
}
