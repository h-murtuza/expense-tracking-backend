import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../database/schemas';
import { UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EMPLOYEE,
    password: 'hashedPassword',
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create chainable mock for Mongoose queries
    const createChainableMock = (returnValue: any) => ({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(returnValue),
    });

    // Mock constructor
    mockUserModel = jest.fn().mockImplementation((userData) => ({
      ...userData,
      save: jest.fn().mockResolvedValue({ ...userData, _id: mockUser._id }),
    }));

    mockUserModel.findOne = jest.fn().mockReturnValue(createChainableMock(null));
    mockUserModel.findById = jest.fn().mockReturnValue(createChainableMock(null));
    mockUserModel.create = jest.fn();
    mockUserModel.prototype = {
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.EMPLOYEE,
    };

    it('should successfully register a new user', async () => {
      const userObjectData = {
        _id: mockUser._id,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.EMPLOYEE,
      };

      const savedUser = {
        ...mockUser,
        _id: {
          toString: jest.fn().mockReturnValue(mockUser._id),
        },
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        save: jest.fn(),
        toObject: jest.fn().mockReturnValue(userObjectData),
      };

      // Mock constructor
      mockUserModel.mockReturnValue(savedUser);
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.register(registerDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(mockUserModel).toHaveBeenCalled();
      expect(savedUser.save).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const userWithPassword = {
        ...mockUser,
        isActive: true,
        toObject: jest.fn().mockReturnValue({
          _id: mockUser._id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        }),
      };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithPassword),
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const userWithPassword = { ...mockUser, isActive: true };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithPassword),
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if valid', async () => {
      const validUser = { ...mockUser, isActive: true };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(validUser),
      });

      const result = await service.validateUser(mockUser._id);

      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(validUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateUser('invalidId')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

