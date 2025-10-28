# Expense Tracking Backend

A robust and scalable REST API for expense tracking and management, built with NestJS, MongoDB, and TypeScript.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin & Employee)
  - Secure password hashing with bcrypt

- **Expense Management**
  - Create, read, update expense records
  - Approve/reject expenses (Admin only)
  - Filter expenses by category, status, and date range
  - Real-time expense analytics

- **Admin Features**
  - View all users in the system
  - Approve or reject pending expenses
  - Access comprehensive analytics

- **Analytics & Reporting**
  - Total expenses and amounts
  - Category-wise breakdowns
  - Status-based statistics

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator, class-transformer
- **Password Hashing**: bcrypt
- **Configuration**: @nestjs/config
- **Testing**: Jest

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (v5.0 or higher) - Running locally or MongoDB Atlas

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd expense-tracking-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Application
   PORT=3001

   # Database
   MONGODB_URI=mongodb://localhost:27017/expense_tracking_db

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRATION=7d
   ```

   **Environment Variables Explained:**
   - `PORT`: The port on which the server will run (default: 3001)
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation (change in production)
   - `JWT_EXPIRATION`: Token expiration time (e.g., 7d, 24h, 60m)

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```
The API will be available at `http://localhost:3001/api`

### Production Mode
```bash
# Build the application
npm run build

# Start the production server
npm run start:prod
```

### Watch Mode
```bash
npm run start:dev
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:cov
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee" // optional, defaults to "employee"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get All Users (Admin Only)
```http
GET /api/auth/users
Authorization: Bearer <token>
```

### Expense Endpoints

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150.00,
  "category": "travel",
  "description": "Client meeting travel",
  "expenseDate": "2025-01-15"
}
```

#### Get All Expenses
```http
GET /api/expenses?category=travel&status=pending&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

#### Get Expense by ID
```http
GET /api/expenses/:id
Authorization: Bearer <token>
```

#### Get Pending Expenses (Admin Only)
```http
GET /api/expenses/pending
Authorization: Bearer <token>
```

#### Update Expense Status (Admin Only)
```http
PATCH /api/expenses/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved", // or "rejected"
  "rejectionReason": "Optional reason for rejection"
}
```

#### Get Analytics
```http
GET /api/expenses/analytics
Authorization: Bearer <token>
```

### Expense Categories
- `travel`
- `food`
- `office_supplies`
- `utilities`
- `equipment`
- `software`
- `marketing`
- `other`

### Expense Status
- `pending` - Awaiting approval
- `approved` - Approved by admin
- `rejected` - Rejected by admin

### User Roles
- `employee` - Can create and view own expenses
- `admin` - Can view all expenses, approve/reject, and access analytics

## 📁 Project Structure

```
expense-tracking-backend/
├── src/
│   ├── app.module.ts              # Main application module
│   ├── main.ts                    # Application entry point
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   ├── auth.service.ts        # Auth business logic
│   │   ├── auth.module.ts         # Auth module configuration
│   │   ├── dto/                   # Data transfer objects
│   │   └── strategies/            # JWT strategy
│   │
│   ├── expenses/                  # Expenses module
│   │   ├── expenses.controller.ts # Expense endpoints
│   │   ├── expenses.service.ts    # Expense business logic
│   │   ├── expenses.module.ts     # Expense module configuration
│   │   └── dto/                   # Data transfer objects
│   │
│   ├── common/                    # Shared resources
│   │   ├── guards/                # Auth & role guards
│   │   ├── decorators/            # Custom decorators
│   │   └── enums/                 # Enums (roles, status, etc.)
│   │
│   └── database/                  # Database configuration
│       ├── schemas/               # Mongoose schemas
│       └── seeds/                 # Database seeding
│
├── test/                          # Test files
├── .env                           # Environment variables (not in git)
├── .env.example                   # Example environment file
├── nest-cli.json                  # NestJS CLI configuration
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

## 🗄️ Database Schema

### User Schema
```typescript
{
  email: String (unique, required)
  password: String (required, hashed)
  firstName: String (required)
  lastName: String (required)
  role: String (enum: ['employee', 'admin'], default: 'employee')
  isActive: Boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### Expense Schema
```typescript
{
  amount: Number (required, min: 0.01)
  category: String (enum, required)
  description: String (required)
  expenseDate: Date (required)
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending')
  rejectionReason: String (optional)
  userId: ObjectId (ref: 'User', required)
  approvedBy: ObjectId (ref: 'User', optional)
  approvedAt: Date (optional)
  createdAt: Date
  updatedAt: Date
}
```

## 🌱 Database Seeding

The application automatically seeds the database with default users on startup:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: Admin

**Employee User:**
- Email: `john.doe@example.com`
- Password: `employee123`
- Role: Employee

## 🔒 Security Features

- Password hashing using bcrypt (salt rounds: 10)
- JWT-based stateless authentication
- Role-based authorization guards
- Input validation using class-validator
- CORS enabled for cross-origin requests
- Environment-based configuration

## 🐛 Common Issues & Troubleshooting

### MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running locally or check your `MONGODB_URI` in `.env`

### JWT Error
```bash
Error: secretOrPrivateKey must have a value
```
**Solution:** Ensure `JWT_SECRET` is set in your `.env` file

### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Change the `PORT` in `.env` or kill the process using port 3001

## 📝 Development Guidelines

1. **Code Style**: Follow NestJS best practices and conventions
2. **Testing**: Write unit tests for all services and controllers
3. **Validation**: Use DTOs with class-validator for input validation
4. **Error Handling**: Use NestJS built-in exception filters
5. **Documentation**: Keep API documentation up to date

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.


