import { Router } from 'express';
import DiaryEntry from '../models/DiaryEntry.js';
import auth from '../middleware/auth.js';

const router = Router();

// 导出全量JSON备份
router.get('/export-all', auth, async (req, res) => {
  const entries = await DiaryEntry.find({ user: req.user._id }).sort({ date: 1 });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="emotion_backup.json"');
  res.json({ version: 1, exportedAt: new Date().toISOString(), entries });
});

// 导入备份（合并去重）
router.post('/import', auth, async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ message: '数据格式错误' });
  let imported = 0;
  for (const e of entries) {
    const exists = await DiaryEntry.findOne({
      user: req.user._id,
      date: e.date,
      time: e.time,
      thought: e.thought
    });
    if (!exists) {
      await DiaryEntry.create({ ...e, user: req.user._id });
      imported++;
    }
  }
  res.json({ imported, total: entries.length });
});

export default router;
