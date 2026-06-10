// Usage: node scripts/seed-admin.js admin@example.com
import 'dotenv/config';
import { connectDB } from '../db.js';
import User from '../models/User.js';

const email = process.argv[2];
if (!email) {
  console.log('用法: node scripts/seed-admin.js <email>');
  process.exit(1);
}

await connectDB();

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.log(`用户 ${email} 不存在，请先注册`);
  process.exit(1);
}

user.role = 'admin';
await user.save();
console.log(`用户 ${email} 已升级为管理员`);
process.exit(0);
