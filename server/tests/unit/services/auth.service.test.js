import { jest } from '@jest/globals';

// Setup environment variable
process.env.JWT_ACCESS_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_CLIENT_URL = 'http://localhost:3000';

// 1. Definisikan mock secara terpisah
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
};

const mockDb = {
  default: { User: mockUser }
};

const mockEmail = {
  sendEmail: jest.fn(),
};

// 2. Gunakan unstable_mockModule untuk ES Modules
jest.unstable_mockModule('bcrypt', () => ({ default: mockBcrypt }));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('../../app/models/index.js', () => mockDb);
jest.unstable_mockModule('../../app/utils/email.js', () => mockEmail);

// 3. Dynamic import setelah mock diinisialisasi
const authService = await import('../../app/services/auth.service.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('mengembalikan token dan data user jika email dan password benar', async () => {
      const mockUserData = {
        user_id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        toJSON: () => ({
          user_id: 1,
          email: 'test@example.com',
          password: 'hashedpassword',
          role: 'user'
        })
      };

      mockUser.findOne.mockResolvedValue(mockUserData);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockJwt.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('email', 'test@example.com');
    });

    it('melempar error jika password salah', async () => {
      mockUser.findOne.mockResolvedValue({ password: 'hashedpassword' });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Email or password is wrong.');
    });

    it('melempar error jika email tidak terdaftar', async () => {
      mockUser.findOne.mockResolvedValue(null);

      await expect(authService.login('notfound@example.com', 'password123'))
        .rejects.toThrow('Email or password is wrong.');
    });
  });

  describe('register()', () => {
    it('membuat user baru jika data valid', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('newhashedpassword');
      
      const mockNewUser = {
        user_id: 2,
        email: 'new@example.com',
        password: 'newhashedpassword',
        toJSON: () => ({
          user_id: 2,
          email: 'new@example.com',
          password: 'newhashedpassword'
        })
      };
      mockUser.create.mockResolvedValue(mockNewUser);

      const data = { email: 'new@example.com', password: 'password', name: 'New User' };
      const result = await authService.register(data);

      expect(mockUser.findOne).toHaveBeenCalled();
      expect(mockUser.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', 'new@example.com');
    });

    it('melempar error jika email sudah ada', async () => {
      mockUser.findOne.mockResolvedValue({ id: 1, email: 'exist@example.com' });

      await expect(authService.register({ email: 'exist@example.com' }))
        .rejects.toThrow('Email already exists.');
    });
  });

  describe('getProfile()', () => {
    it('mengembalikan profile user jika user_id valid', async () => {
      mockUser.findByPk.mockResolvedValue({ id: 1, name: 'User1' });

      const result = await authService.getProfile(1);
      expect(result).toHaveProperty('name', 'User1');
    });

    it('melempar error jika user tidak ditemukan', async () => {
      mockUser.findByPk.mockResolvedValue(null);

      await expect(authService.getProfile(999)).rejects.toThrow('User not found.');
    });
  });

  describe('forgotPassword()', () => {
    it('mengirim email reset password jika email valid', async () => {
      mockUser.findOne.mockResolvedValue({ user_id: 1, email: 'test@example.com', password: 'hash' });
      mockJwt.sign.mockReturnValue('reset-token');

      const result = await authService.forgotPassword('test@example.com');

      expect(mockEmail.sendEmail).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('melempar error jika email tidak ditemukan', async () => {
      mockUser.findOne.mockResolvedValue(null);

      await expect(authService.forgotPassword('notfound@example.com'))
        .rejects.toThrow('Email not found.');
    });
  });

  describe('resetPassword()', () => {
    it('mengganti password jika token valid', async () => {
      const mockUpdate = jest.fn();
      mockUser.findByPk.mockResolvedValue({ user_id: 1, password: 'oldhash', update: mockUpdate });
      mockJwt.verify.mockReturnValue({ user_id: 1 });
      mockBcrypt.hash.mockResolvedValue('newhash');

      const result = await authService.resetPassword(1, 'valid-token', 'newpass');

      expect(mockJwt.verify).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({ password: 'newhash' });
      expect(result).toHaveProperty('message', 'Password has been reset successfully.');
    });

    it('melempar error jika user tidak valid', async () => {
      mockUser.findByPk.mockResolvedValue(null);

      await expect(authService.resetPassword(99, 'token', 'newpass'))
        .rejects.toThrow('Invalid user.');
    });

    it('melempar error jika token tidak valid atau expired', async () => {
      mockUser.findByPk.mockResolvedValue({ user_id: 1, password: 'oldhash' });
      mockJwt.verify.mockImplementation(() => { throw new Error('Expired'); });

      await expect(authService.resetPassword(1, 'bad-token', 'newpass'))
        .rejects.toThrow('Invalid token or expired.');
    });
  });
});
