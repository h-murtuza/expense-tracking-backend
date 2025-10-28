import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../database/schemas';
import {
  CreateExpenseDto,
  UpdateExpenseStatusDto,
  GetExpensesQueryDto,
} from './dto';
import { UserRole, ExpenseStatus } from '../common/enums';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    const expense = new this.expenseModel({
      ...createExpenseDto,
      userId: new Types.ObjectId(userId),
      status: ExpenseStatus.PENDING,
    });

    await expense.save();
    return await this.expenseModel
      .findById(expense._id)
      .populate('user', 'firstName lastName email role')
      .exec();
  }

  async findAll(
    userId: string,
    userRole: UserRole,
    query: GetExpensesQueryDto,
  ) {
    const { category, status, startDate, endDate } = query;
    const filter: any = {};

    // Employees can only see their own expenses
    if (userRole === UserRole.EMPLOYEE) {
      filter.userId = new Types.ObjectId(userId);
    }

    // Apply filters
    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) {
        filter.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.expenseDate.$lte = new Date(endDate);
      }
    }

    const expenses = await this.expenseModel
      .find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .exec();

    return expenses;
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid expense ID');
    }

    const expense = await this.expenseModel
      .findById(id)
      .populate('user', 'firstName lastName email role')
      .exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Employees can only view their own expenses
    if (
      userRole === UserRole.EMPLOYEE &&
      expense.userId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only view your own expenses');
    }

    return expense;
  }

  async updateStatus(
    id: string,
    updateExpenseStatusDto: UpdateExpenseStatusDto,
    adminId: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid expense ID');
    }

    const expense = await this.expenseModel.findById(id).exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        'Only pending expenses can be approved or rejected',
      );
    }

    const { status, rejectionReason } = updateExpenseStatusDto;

    if (status === ExpenseStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting an expense',
      );
    }

    expense.status = status;
    expense.approvedBy = new Types.ObjectId(adminId);
    expense.approvedAt = new Date();

    if (rejectionReason) {
      expense.rejectionReason = rejectionReason;
    }

    await expense.save();

    return await this.expenseModel
      .findById(expense._id)
      .populate('user', 'firstName lastName email role')
      .exec();
  }

  async getAnalytics(userId: string, userRole: UserRole) {
    const filter: any = {};

    // Employees can only see their own analytics
    if (userRole === UserRole.EMPLOYEE) {
      filter.userId = new Types.ObjectId(userId);
    }

    const expenses = await this.expenseModel.find(filter).exec();

    // Calculate total by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += Number(expense.amount);
      return acc;
    }, {});

    // Calculate total by status
    const statusTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.status]) {
        acc[expense.status] = 0;
      }
      acc[expense.status] += Number(expense.amount);
      return acc;
    }, {});

    // Calculate overall totals
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    const pendingCount = expenses.filter(
      (e) => e.status === ExpenseStatus.PENDING,
    ).length;
    const approvedCount = expenses.filter(
      (e) => e.status === ExpenseStatus.APPROVED,
    ).length;
    const rejectedCount = expenses.filter(
      (e) => e.status === ExpenseStatus.REJECTED,
    ).length;

    return {
      totalExpenses,
      totalAmount,
      categoryTotals,
      statusTotals,
      statusCounts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  }

  async getPendingExpenses() {
    return await this.expenseModel
      .find({ status: ExpenseStatus.PENDING })
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: 1 })
      .exec();
  }
}
