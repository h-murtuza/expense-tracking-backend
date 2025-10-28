import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from '../database/schemas';
import { UserRole, ExpenseStatus, ExpenseCategory } from '../common/enums';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let mockExpenseModel: any;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    role: UserRole.EMPLOYEE,
  };

  const mockExpense = {
    _id: '507f1f77bcf86cd799439012',
    amount: 100,
    category: ExpenseCategory.FOOD,
    description: 'Test expense',
    expenseDate: new Date('2024-01-15'),
    status: ExpenseStatus.PENDING,
    userId: mockUser.id,
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.EMPLOYEE,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create chainable mock for Mongoose queries
    const createChainableMock = (returnValue: any) => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(returnValue),
    });

    // Mock constructor
    mockExpenseModel = jest.fn().mockImplementation((expenseData) => ({
      ...expenseData,
      save: jest.fn().mockResolvedValue({ ...expenseData, _id: mockExpense._id }),
    }));

    mockExpenseModel.create = jest.fn();
    mockExpenseModel.find = jest.fn();
    mockExpenseModel.findById = jest.fn();
    mockExpenseModel.findByIdAndUpdate = jest.fn();
    mockExpenseModel.aggregate = jest.fn();
    mockExpenseModel.prototype = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getModelToken(Expense.name),
          useValue: mockExpenseModel,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createExpenseDto = {
      amount: 100,
      category: ExpenseCategory.FOOD,
      description: 'Test expense',
      expenseDate: '2024-01-15',
    };

    it('should create a new expense', async () => {
      const savedExpense = {
        ...mockExpense,
        _id: mockExpense._id,
        save: jest.fn().mockResolvedValue(mockExpense),
      };

      // Mock the constructor to return an expense with save method
      mockExpenseModel.mockReturnValue(savedExpense);
      
      // Mock the findById call after save
      mockExpenseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpense),
      });

      const result = await service.create(mockUser.id, createExpenseDto);

      expect(mockExpenseModel).toHaveBeenCalled();
      expect(savedExpense.save).toHaveBeenCalled();
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll', () => {
    it('should return all expenses for an employee', async () => {
      const mockExpenses = [mockExpense];
      mockExpenseModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.findAll(mockUser.id, UserRole.EMPLOYEE, {});

      // Check that find was called (userId will be ObjectId)
      expect(mockExpenseModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });

    it('should return all expenses for an admin', async () => {
      const mockExpenses = [mockExpense];
      mockExpenseModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.findAll(mockUser.id, UserRole.ADMIN, {});

      expect(mockExpenseModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockExpenses);
    });

    it('should filter expenses by category', async () => {
      const mockExpenses = [mockExpense];
      const filters = { category: ExpenseCategory.FOOD };

      mockExpenseModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.findAll(mockUser.id, UserRole.EMPLOYEE, filters);

      // Verify find was called and filter was applied
      expect(mockExpenseModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });

    it('should filter expenses by status', async () => {
      const mockExpenses = [mockExpense];
      const filters = { status: ExpenseStatus.APPROVED };

      mockExpenseModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.findAll(mockUser.id, UserRole.EMPLOYEE, filters);

      // Verify find was called and filter was applied
      expect(mockExpenseModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });
  });

  describe('findOne', () => {
    it('should return an expense if user owns it', async () => {
      mockExpenseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockExpense),
      });

      const result = await service.findOne(
        mockExpense._id,
        mockUser.id,
        UserRole.EMPLOYEE,
      );

      expect(mockExpenseModel.findById).toHaveBeenCalledWith(mockExpense._id);
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockExpenseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne('invalidId', mockUser.id, UserRole.EMPLOYEE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if employee tries to access others expense', async () => {
      const otherUserExpense = {
        ...mockExpense,
        userId: 'differentUserId',
      };
      mockExpenseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(otherUserExpense),
      });

      await expect(
        service.findOne(mockExpense._id, mockUser.id, UserRole.EMPLOYEE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any expense', async () => {
      const otherUserExpense = {
        ...mockExpense,
        userId: 'differentUserId',
      };
      mockExpenseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(otherUserExpense),
      });

      const result = await service.findOne(
        mockExpense._id,
        mockUser.id,
        UserRole.ADMIN,
      );

      expect(result).toEqual(otherUserExpense);
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = {
      status: ExpenseStatus.APPROVED,
    };

    it('should update expense status', async () => {
      const savedExpense = {
        ...mockExpense,
        status: ExpenseStatus.APPROVED,
        approvedBy: mockUser.id,
        approvedAt: new Date(),
      };

      const expenseToUpdate = {
        ...mockExpense,
        status: ExpenseStatus.PENDING,
        save: jest.fn().mockResolvedValue(savedExpense),
      };

      // Mock the initial findById
      mockExpenseModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(expenseToUpdate),
      });

      // Mock the second findById after save
      mockExpenseModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(savedExpense),
      });

      const result = await service.updateStatus(
        mockExpense._id,
        updateStatusDto,
        mockUser.id,
      );

      expect(mockExpenseModel.findById).toHaveBeenCalled();
      expect(result.status).toBe(ExpenseStatus.APPROVED);
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockExpenseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateStatus('invalidId', updateStatusDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingExpenses', () => {
    it('should return all pending expenses', async () => {
      const pendingExpenses = [
        { ...mockExpense, status: ExpenseStatus.PENDING },
      ];
      mockExpenseModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingExpenses),
      });

      const result = await service.getPendingExpenses();

      expect(mockExpenseModel.find).toHaveBeenCalledWith({
        status: ExpenseStatus.PENDING,
      });
      expect(result).toEqual(pendingExpenses);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for employee', async () => {
      const mockExpenses = [
        { ...mockExpense, amount: 100, category: ExpenseCategory.FOOD, status: ExpenseStatus.PENDING },
        { ...mockExpense, amount: 200, category: ExpenseCategory.TRAVEL, status: ExpenseStatus.APPROVED },
      ];

      mockExpenseModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.getAnalytics(mockUser.id, UserRole.EMPLOYEE);

      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('categoryTotals');
      expect(result).toHaveProperty('statusCounts');
      expect(result.totalExpenses).toBe(2);
      expect(result.totalAmount).toBe(300);
    });

    it('should return analytics for admin (all users)', async () => {
      const mockExpenses = [
        { ...mockExpense, amount: 100, category: ExpenseCategory.FOOD, status: ExpenseStatus.PENDING },
        { ...mockExpense, amount: 200, category: ExpenseCategory.TRAVEL, status: ExpenseStatus.APPROVED },
        { ...mockExpense, amount: 150, category: ExpenseCategory.FOOD, status: ExpenseStatus.REJECTED },
      ];

      mockExpenseModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExpenses),
      });

      const result = await service.getAnalytics(mockUser.id, UserRole.ADMIN);

      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('totalAmount');
      expect(result.totalExpenses).toBe(3);
      expect(result.totalAmount).toBe(450);
    });
  });
});

