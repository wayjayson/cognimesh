import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.js';
import { refreshAuth } from '../middleware/auth.js';

const router = Router();

const isValidPassword = (pwd) => {
  const types = [/[a-z]/.test(pwd), /[A-Z]/.test(pwd), /\d/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
  return pwd.length >= 8 && types >= 2;
};

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
    if (!isValidPassword(password)) return res.status(400).json({ message: '密码至少8位且包含大小写字母、数字、符号中的两种' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: '邮箱已注册' });
    const user = await User.create({ email, password });
    const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    res.status(201).json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: '邮箱或密码错误' });
    const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: '登录失败' });
  }
});

router.post('/refresh-token', refreshLimiter, refreshAuth, async (req, res) => {
  const accessToken = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.json({ accessToken });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, role: req.user.role } });
});

router.post('/logout', auth, (req, res) => {
  // Token remains valid until expiry (15m access / 7d refresh).
  // For production, consider maintaining a token blacklist in Redis.
  res.json({ message: '已登出' });
});

export default router;
