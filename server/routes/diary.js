import { Router } from 'express';
import DiaryEntry from '../models/DiaryEntry.js';
import auth from '../middleware/auth.js';
import { getEmotionLabel } from '../utils/emotion.js';

const router = Router();

function escapeCSVField(field) {
  if (field == null) return '';
  const str = String(field);
  // Prefix single-quote to prevent formula injection (=, +, -, @, tab, carriage-return)
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  // Wrap in quotes and escape internal quotes if field contains commas, quotes, newlines, or special chars
  if (/[",\n\r\t]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

router.post('/', auth, async (req, res) => {
  try {
    const { date, time, situation, thought, valence, arousal } = req.body;
    if (!date || !time || valence === undefined || arousal === undefined) {
      return res.status(400).json({ message: '日期、时间、效价和唤醒度为必填' });
    }
    const emotion = getEmotionLabel(valence, arousal);
    const entry = await DiaryEntry.create({
      user: req.user._id,
      date, time, situation, thought,
      valence, arousal, emotion
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: '记录创建失败' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    let { year, month } = req.query;
    year = parseInt(year);
    month = parseInt(month);
    const monthStr = String(month).padStart(2, '0');
    const regex = new RegExp(`^${year}-${monthStr}-`);
    const entries = await DiaryEntry.find({
      user: req.user._id,
      date: { $regex: regex }
    }).sort({ date: 1, time: 1 });

    const stats = {};
    entries.forEach(e => {
      if (!stats[e.date]) {
        stats[e.date] = { count: 0, valenceSum: 0, arousalSum: 0 };
      }
      stats[e.date].count++;
      stats[e.date].valenceSum += e.valence;
      stats[e.date].arousalSum += e.arousal;
    });
    const dateStats = Object.entries(stats).map(([date, data]) => ({
      date,
      count: data.count,
      avgValence: +(data.valenceSum / data.count).toFixed(2),
      avgArousal: +(data.arousalSum / data.count).toFixed(1),
    }));

    res.json({ entries, stats: dateStats });
  } catch (error) {
    res.status(500).json({ message: '获取日记失败' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: '记录未找到' });
    const { date, time, situation, thought, valence, arousal } = req.body;
    if (valence !== undefined && arousal !== undefined) {
      const emotion = getEmotionLabel(valence, arousal);
      entry.emotion = emotion;
    }
    if (date) entry.date = date;
    if (time) entry.time = time;
    if (situation !== undefined) entry.situation = situation;
    if (thought !== undefined) entry.thought = thought;
    if (valence !== undefined) entry.valence = valence;
    if (arousal !== undefined) entry.arousal = arousal;
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: '更新失败' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await DiaryEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: '记录未找到' });
    res.json({ message: '已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

router.get('/recent', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const entries = await DiaryEntry.find({ user: req.user._id })
      .sort({ date: -1, time: -1 })
      .limit(limit);
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: '获取最近日记失败' });
  }
});

router.get('/export', auth, async (req, res) => {
  try {
    let { year, month } = req.query;
    year = parseInt(year);
    month = parseInt(month);
    const monthStr = String(month).padStart(2, '0');
    const regex = new RegExp(`^${year}-${monthStr}-`);
    const entries = await DiaryEntry.find({ user: req.user._id, date: { $regex: regex } }).sort({ date: 1, time: 1 });
    const headers = ['日期', '时间', '情境', '闪念', '心情(效价)', '精神(唤醒度)', '情绪标签'];
    const csvRows = [headers.join(',')];
    entries.forEach(e => {
      const row = [
        escapeCSVField(e.date), escapeCSVField(e.time),
        escapeCSVField(e.situation),
        escapeCSVField(e.thought),
        e.valence, e.arousal, escapeCSVField(e.emotion)
      ];
      csvRows.push(row.join(','));
    });
    const csvContent = '﻿' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=diary_${year}_${monthStr}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: '导出失败' });
  }
});

export default router;
