// adminAuth — must be used AFTER the auth middleware (auth sets req.user)
// Usage: router.use(auth, adminAuth);
export default function adminAuth(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}
