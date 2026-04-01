import { Request, Response } from 'express';
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
console.log('--- Auth Controller Loaded ---');
import User from '../models/User';
import { registerSchema, loginSchema } from '../validators';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    const user = await User.create(validated);

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
          budgetLimit: user.budgetLimit,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
      return;
    }
    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email }).select(
      '+password'
    );
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(validated.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      res.json({
        success: true,
        message: 'MFA required',
        data: {
          mfaRequired: true,
          userId: user._id.toString(),
        },
      });
      return;
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
          budgetLimit: user.budgetLimit,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
      return;
    }
    throw error;
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
      return;
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.userId, { refreshToken: '' });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        budgetLimit: user.budgetLimit,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, currency, budgetLimit } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, currency, budgetLimit },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        budgetLimit: user.budgetLimit,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const setup2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Setting up 2FA for userId:', req.userId);
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('User not found for setup2FA');
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!authenticator || typeof authenticator.generateSecret !== 'function') {
      throw new Error('Authenticator not loaded correctly');
    }
    if (!QRCode || typeof QRCode.toDataURL !== 'function') {
      throw new Error('QRCode not loaded correctly');
    }

    if (!user.email) {
      throw new Error('User email is missing');
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'FinTrackPro', secret);
    console.log('OTP URI Generated:', otpauth);
    
    const qrCodeDataUri = await QRCode.toDataURL(otpauth);
    console.log('QR Code generated successfully');

    // Save secret temporarily (not enabled yet)
    user.twoFactorSecret = secret;
    await user.save();
    console.log('Secret saved temporarily');

    res.json({
      success: true,
      data: {
        qrCodeDataUri,
        secret,
      },
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
  }
};

export const verify2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.userId).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ success: false, message: '2FA setup not initiated' });
      return;
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid verification token' });
      return;
    }

    user.isTwoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
          budgetLimit: user.budgetLimit,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
};

export const login2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      res.status(401).json({ success: false, message: '2FA not enabled for this user' });
      return;
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid 2FA token' });
      return;
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
          budgetLimit: user.budgetLimit,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const disable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { isTwoFactorEnabled: false, twoFactorSecret: '' },
      { new: true }
    );

    res.json({
      success: true,
      message: '2FA disabled successfully',
      data: {
        isTwoFactorEnabled: user?.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
};
