import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { UserRole, ExpenseStatus, ExpenseCategory } from '../common/enums';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: UserRole.EMPLOYEE,
  };

  const mockExpense = {
    id: '507f1f77bcf86cd799439012',
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
  };

  const mockExpensesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    getPendingExpenses: jest.fn(),
    getAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const createExpenseDto = {
        amount: 100,
        category: ExpenseCategory.FOOD,
        description: 'Test expense',
        expenseDate: '2024-01-15',
      };

      mockExpensesService.create.mockResolvedValue(mockExpense);

      const result = await controller.create(mockUser, createExpenseDto);

      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        createExpenseDto,
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll', () => {
    it('should return all expenses for the user', async () => {
      const mockExpenses = [mockExpense];
      const query = { category: ExpenseCategory.FOOD };

      mockExpensesService.findAll.mockResolvedValue(mockExpenses);

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        query,
      );
      expect(result).toEqual(mockExpenses);
    });
  });

  describe('getPendingExpenses', () => {
    it('should return all pending expenses', async () => {
      const pendingExpenses = [
        { ...mockExpense, status: ExpenseStatus.PENDING },
      ];

      mockExpensesService.getPendingExpenses.mockResolvedValue(
        pendingExpenses,
      );

      const result = await controller.getPendingExpenses();

      expect(service.getPendingExpenses).toHaveBeenCalled();
      expect(result).toEqual(pendingExpenses);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for the user', async () => {
      const mockAnalytics = {
        totalExpenses: 10,
        totalAmount: 1000,
        categoryTotals: { [ExpenseCategory.FOOD]: 500 },
        statusCounts: {
          pending: 3,
          approved: 5,
          rejected: 2,
        },
      };

      mockExpensesService.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getAnalytics(mockUser);

      expect(service.getAnalytics).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
      );
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('findOne', () => {
    it('should return a single expense', async () => {
      mockExpensesService.findOne.mockResolvedValue(mockExpense);

      const result = await controller.findOne(mockExpense.id, mockUser);

      expect(service.findOne).toHaveBeenCalledWith(
        mockExpense.id,
        mockUser.id,
        mockUser.role,
      );
      expect(result).toEqual(mockExpense);
    });
  });

  describe('updateStatus', () => {
    it('should update expense status', async () => {
      const updateStatusDto = {
        status: ExpenseStatus.APPROVED,
      };
      const updatedExpense = {
        ...mockExpense,
        status: ExpenseStatus.APPROVED,
      };

      mockExpensesService.updateStatus.mockResolvedValue(updatedExpense);

      const result = await controller.updateStatus(
        mockExpense.id,
        updateStatusDto,
        mockUser,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        mockExpense.id,
        updateStatusDto,
        mockUser.id,
      );
      expect(result).toEqual(updatedExpense);
    });
  });
});

