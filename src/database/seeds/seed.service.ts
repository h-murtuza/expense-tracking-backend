import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, Expense, ExpenseDocument } from '../schemas';
import { UserRole, ExpenseCategory, ExpenseStatus } from '../../common/enums';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Expense.name)
    private expenseModel: Model<ExpenseDocument>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const userCount = await this.userModel.countDocuments().exec();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new this.userModel({
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create employee users
    const employeePassword = await bcrypt.hash('employee123', 10);

    const employee1 = new this.userModel({
      email: 'john.doe@example.com',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.EMPLOYEE,
      isActive: true,
    });
    await employee1.save();

    const employee2 = new this.userModel({
      email: 'jane.smith@example.com',
      password: employeePassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.EMPLOYEE,
      isActive: true,
    });
    await employee2.save();
    console.log('✅ Employee users created');

    // Create sample expenses for employee1
    const expenses1 = [
      {
        userId: employee1._id,
        amount: 150.5,
        category: ExpenseCategory.TRAVEL,
        description: 'Flight tickets to client meeting',
        expenseDate: new Date('2025-10-15'),
        status: ExpenseStatus.APPROVED,
        approvedBy: admin._id,
        approvedAt: new Date(),
      },
      {
        userId: employee1._id,
        amount: 45.0,
        category: ExpenseCategory.FOOD,
        description: 'Team lunch with client',
        expenseDate: new Date('2025-10-20'),
        status: ExpenseStatus.PENDING,
      },
      {
        userId: employee1._id,
        amount: 299.99,
        category: ExpenseCategory.SOFTWARE,
        description: 'Annual license for development tool',
        expenseDate: new Date('2025-10-22'),
        status: ExpenseStatus.APPROVED,
        approvedBy: admin._id,
        approvedAt: new Date(),
      },
      {
        userId: employee1._id,
        amount: 75.0,
        category: ExpenseCategory.OFFICE_SUPPLIES,
        description: 'Ergonomic keyboard and mouse',
        expenseDate: new Date('2025-10-25'),
        status: ExpenseStatus.PENDING,
      },
    ];

    // Create sample expenses for employee2
    const expenses2 = [
      {
        userId: employee2._id,
        amount: 200.0,
        category: ExpenseCategory.TRAVEL,
        description: 'Hotel accommodation for conference',
        expenseDate: new Date('2025-10-18'),
        status: ExpenseStatus.APPROVED,
        approvedBy: admin._id,
        approvedAt: new Date(),
      },
      {
        userId: employee2._id,
        amount: 89.99,
        category: ExpenseCategory.EQUIPMENT,
        description: 'Wireless headset for calls',
        expenseDate: new Date('2025-10-21'),
        status: ExpenseStatus.REJECTED,
        approvedBy: admin._id,
        approvedAt: new Date(),
        rejectionReason: 'Please use company-approved vendors',
      },
      {
        userId: employee2._id,
        amount: 120.0,
        category: ExpenseCategory.MARKETING,
        description: 'Social media advertising campaign',
        expenseDate: new Date('2025-10-23'),
        status: ExpenseStatus.PENDING,
      },
      {
        userId: employee2._id,
        amount: 35.5,
        category: ExpenseCategory.UTILITIES,
        description: 'Internet bill for home office',
        expenseDate: new Date('2025-10-26'),
        status: ExpenseStatus.PENDING,
      },
    ];

    const allExpenses = [...expenses1, ...expenses2];

    for (const expenseData of allExpenses) {
      const expense = new this.expenseModel(expenseData);
      await expense.save();
    }

    console.log('✅ Sample expenses created');
    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Employee 1: john.doe@example.com / employee123');
    console.log('   Employee 2: jane.smith@example.com / employee123');
    console.log('');
  }
}
