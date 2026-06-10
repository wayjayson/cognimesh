import { Router } from 'express';

const router = Router();

// 前端错误上报
// 生产环境中可扩展写入日志文件或接入第三方监控服务（如 Sentry）
router.post('/log-error', (req, res) => {
  const { message, stack } = req.body;
  console.error(`[CLIENT ERROR] ${new Date().toISOString()}: ${message}`, stack || '');
  res.status(200).json({ logged: true });
});

export default router;
