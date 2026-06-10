import { Router } from 'express';
import DiaryEntry from '../models/DiaryEntry.js';
import auth from '../middleware/auth.js';
import { insightLimiter } from '../middleware/rateLimiter.js';
import { generateEmotionWeather } from '../services/ai.service.js';

const router = Router();

router.post('/', auth, insightLimiter, async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !['instant', 'period', 'deep'].includes(type)) {
      return res.status(400).json({ message: '请提供有效的报告类型 (instant/period/deep)' });
    }

    const today = new Date().toISOString().split('T')[0];
    let startDate, entries;

    switch (type) {
      case 'instant': {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        startDate = d.toISOString().split('T')[0];
        entries = await DiaryEntry.find({
          user: req.user._id,
          date: { $gte: startDate, $lte: today }
        }).sort({ date: 1, time: 1 });
        break;
      }
      case 'period': {
        const d = new Date();
        d.setDate(d.getDate() - 13);
        startDate = d.toISOString().split('T')[0];
        entries = await DiaryEntry.find({
          user: req.user._id,
          date: { $gte: startDate, $lte: today }
        }).sort({ date: 1, time: 1 });
        break;
      }
      case 'deep': {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        startDate = d.toISOString().split('T')[0];
        entries = await DiaryEntry.find({
          user: req.user._id,
          date: { $gte: startDate, $lte: today }
        }).sort({ date: 1, time: 1 });
        break;
      }
    }

    const result = await generateEmotionWeather(type, entries);
    res.json({ result, type });
  } catch (error) {
    console.error('EmotionWeather error:', error.message);
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      message: '报告生成失败',
      ...(isDev && { detail: error.message, code: error.code, type: error.type })
    });
  }
});

export default router;
