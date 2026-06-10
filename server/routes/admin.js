import { Router } from 'express';
import DiaryEntry from '../models/DiaryEntry.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(auth, adminAuth);

// GET /api/admin/stats — system statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalEntries, entriesThisMonth] = await Promise.all([
      User.countDocuments(),
      DiaryEntry.countDocuments(),
      DiaryEntry.countDocuments({
        date: { $gte: new Date().toISOString().slice(0, 7) + '-01' }
      })
    ]);

    // Users registered per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Active users (posted in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const activeUserIds = await DiaryEntry.distinct('user', { date: { $gte: sevenDaysAgo } });

    res.json({
      totalUsers,
      totalEntries,
      entriesThisMonth,
      activeUsers: activeUserIds.length,
      usersByMonth
    });
  } catch (error) {
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();

    // Attach entry counts for each user
    const userIds = users.map(u => u._id);
    const entryCounts = await DiaryEntry.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, lastDate: { $max: '$date' } } }
    ]);
    const countMap = {};
    entryCounts.forEach(e => { countMap[e._id.toString()] = { count: e.count, lastDate: e.lastDate }; });

    const result = users.map(u => ({
      ...u,
      entryCount: countMap[u._id.toString()]?.count || 0,
      lastEntryDate: countMap[u._id.toString()]?.lastDate || null
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// GET /api/admin/users/:id/entries — view a user's diary entries
router.get('/users/:id/entries', async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ user: req.params.id }).sort({ date: -1, time: -1 }).limit(100).lean();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: '获取用户日记失败' });
  }
});

// DELETE /api/admin/users/:id — delete a user and all their entries
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.role === 'admin') return res.status(400).json({ message: '不能删除管理员账户' });

    await Promise.all([
      DiaryEntry.deleteMany({ user: req.params.id }),
      User.findByIdAndDelete(req.params.id)
    ]);
    console.log(`[AUDIT] Admin ${req.user.email} deleted user ${user.email} (${user._id})`);
    res.json({ message: '用户及数据已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

// DELETE /api/admin/entries/:id — delete a specific entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: '条目不存在' });
    await DiaryEntry.findByIdAndDelete(req.params.id);
    console.log(`[AUDIT] Admin ${req.user.email} deleted entry ${req.params.id} (user: ${entry.user})`);
    res.json({ message: '条目已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

export default router;
