import React, { useState, useMemo } from 'react';
import { login, register } from '../api';
import toast from 'react-hot-toast';

const CELL_COLORS = ['warm', 'pink', 'blue', 'green'];

function generateGrid(rows, cols, density = 0.5) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const filled = Math.random() < density;
      const color = filled ? CELL_COLORS[Math.floor(Math.random() * 4)] : null;
      cells.push(color);
    }
  }
  return cells;
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stable calendar grid pattern (generated once, not on re-render)
  const gridCells = useMemo(() => generateGrid(6, 7, 0.5), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isRegister ? await register(email, password) : await login(email, password);
      onLogin(user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    if (!import.meta.env.VITE_ENABLE_DEMO) {
      toast.error('演示模式未启用');
      return;
    }
    setLoading(true);
    try {
      const user = await login('demo@cognimesh.app', 'demo123');
      onLogin(user);
    } catch (err) {
      try {
        const user = await register('demo@cognimesh.app', 'demo123');
        onLogin(user);
      } catch (regErr) {
        toast.error('快速登录失败，请手动注册');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      {/* Emotion calendar grid background */}
      <div className="login-bg-grid">
        {gridCells.map((color, i) =>
          color ? <div key={i} className={`login-bg-cell ${color}`} /> : <div key={i} className="login-bg-cell" />
        )}
      </div>

      {/* Warm glow overlay */}
      <div className="login-bg-glow" />

      {/* Floating particles */}
      <div className="login-bg-particle" />
      <div className="login-bg-particle" />
      <div className="login-bg-particle" />
      <div className="login-bg-particle" />
      <div className="login-bg-particle" />

      <div className="login-card">
        <h1 className="login-title">🧠 CogniMesh</h1>
        <p className="login-subtitle">认知镜像 · 情绪日历</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-row">
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>
          <button className="btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注 册' : '登 录'}
          </button>
        </form>
        <div style={{ color: 'var(--text-secondary)', margin: '12px 0', fontSize: '0.7rem' }}>— 或 —</div>
        <button className="btn-secondary"
          style={{ border: '1px solid #f0b27a', color: '#f0b27a', width: '100%' }}
          onClick={handleQuickLogin} disabled={loading}>
          快速体验（跳过登录）
        </button>
        <p className="login-toggle">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button onClick={() => setIsRegister(!isRegister)} className="login-toggle-btn">
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>
      </div>
    </div>
  );
}
