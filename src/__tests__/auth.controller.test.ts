import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { userSignIn } from '../controllers/auth.controller';
import * as secretManager from '../utils/secret-manager';

// Mock dependencies
jest.mock('passport');
jest.mock('jsonwebtoken');
jest.mock('../utils/secret-manager');

// Define explicit mock functions for the logger
const mockLogError = jest.fn();
const mockLogInfo = jest.fn();

jest.mock('../utils/logger', () => ({
    logger: { // The module exports an object with a 'logger' property
        error: mockLogError, // Use the explicit mock function here
        info: mockLogInfo,   // Use the explicit mock function here
    },
}));

describe('Auth Controller - userSignIn', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNextFunction: NextFunction = jest.fn();
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockCookie: jest.Mock;

    beforeEach(() => {
        // Clear all mocks, including the logger ones, before each test
        mockLogError.mockClear();
        mockLogInfo.mockClear();

        mockStatus = jest.fn().mockReturnThis();
        mockJson = jest.fn().mockReturnThis();
        mockCookie = jest.fn();
        mockRequest = {
            body: {
                email: 'test@example.com',
                password: 'password123',
            },
            cookies: {},
        };
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            cookie: mockCookie,
        };
    });

    afterEach(() => {
        jest.clearAllMocks(); // This clears all mock call history, etc.
    });

    test('should successfully sign in a user and return tokens', async () => {
        const mockUserData = {
            id: 'mockAccessToken', // This is the JWT access token from passport-local strategy
            _id: 'user123',
            role: 'user',
            firstName: 'Test',
            lastName: 'User',
        };
        const mockRefreshToken = 'mockRefreshToken';
        const mockRefreshSecret = 'mockRefreshSecret';

        (passport.authenticate as jest.Mock).mockImplementation(
            (strategy, options, callback) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    callback(null, mockUserData);
                };
            }
        );

        (secretManager.getRefreshSecretKey as jest.Mock).mockResolvedValue(mockRefreshSecret);
        (jwt.sign as jest.Mock).mockReturnValue(mockRefreshToken);

        const middleware = userSignIn as any;
        await middleware(mockRequest as Request, mockResponse as Response, mockNextFunction);

        expect(passport.authenticate).toHaveBeenCalledWith('local', { session: false }, expect.any(Function));
        expect(secretManager.getRefreshSecretKey).toHaveBeenCalled();
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: mockUserData._id },
            mockRefreshSecret,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', mockRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
            accessToken: mockUserData.id,
            role: mockUserData.role,
            firstName: mockUserData.firstName,
            lastName: mockUserData.lastName,
            message: 'User Logged In Successfully',
        });
    });

    test('should return 400 if authentication fails (no userData)', async () => {
        (passport.authenticate as jest.Mock).mockImplementation(
            (strategy, options, callback) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    callback(null, null);
                };
            }
        );

        const middleware = userSignIn as any;
        await middleware(mockRequest as Request, mockResponse as Response, mockNextFunction);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            message: 'Authentication failed',
        });
        expect(mockLogError).not.toHaveBeenCalled(); // Use mockLogError
    });

    test('should return 400 if passport authentication returns an error', async () => {
        const authError = new Error('Passport error');
        (passport.authenticate as jest.Mock).mockImplementation(
            (strategy, options, callback) => {
                return (req: Request, res: Response, next: NextFunction) => {
                    callback(authError, null);
                };
            }
        );

        const middleware = userSignIn as any;
        await middleware(mockRequest as Request, mockResponse as Response, mockNextFunction);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            message: authError.message,
        });
        expect(mockLogError).not.toHaveBeenCalled(); // Use mockLogError
    });
});