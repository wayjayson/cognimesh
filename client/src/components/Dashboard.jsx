import React, { useState, useEffect, useMemo } from 'react';
import CalendarView from './CalendarView';
import DetailPanel from './DetailPanel';
import RecordForm from './RecordForm';
import TrendChart from './TrendChart';
import EmotionWeather from './EmotionWeather';
import ExportButton from './ExportButton';
import DataManagement from './DataManagement';
import FeedbackTip from './FeedbackTip';
import NetworkModal from './NetworkModal';
import AdminPanel from './AdminPanel';
import { fetchDiaryMonth } from '../api';
import { useStore } from '../store';

const THEMES = [
  { key: 'dark', label: '深色', icon: '🌙' },
  { key: 'light', label: '浅色', icon: '☀️' },
  { key: 'eye-care', label: '护眼', icon: '🌿' },
  { key: 'parchment', label: '羊皮纸', icon: '📜' },
];

function getSavedTheme() {
  return localStorage.getItem('theme') || 'dark';
}

export default function Dashboard({ user, onLogout }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [theme, setTheme] = useState(getSavedTheme);
  const { entries, setMonthData, refreshTrigger, triggerRefresh } = useStore();

  const switchTheme = (key) => {
    setTheme(key);
    localStorage.setItem('theme', key);
    document.documentElement.setAttribute('data-theme', key);
  };

  const loadMonth = () => {
    fetchDiaryMonth(year, month).then(data => setMonthData(data.entries, data.stats));
  };

  useEffect(() => { loadMonth(); }, [year, month]);
  useEffect(() => { loadMonth(); }, [refreshTrigger]);

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthEntries = entries.filter(e => e.date.startsWith(prefix));
    const totalDays = new Set(monthEntries.map(e => e.date)).size;
    const total = monthEntries.length;
    const avgV = total ? monthEntries.reduce((s, e) => s + e.valence, 0) / total : null;
    const posDays = new Set(monthEntries.filter(e => e.valence > 0).map(e => e.date)).size;
    const negDays = new Set(monthEntries.filter(e => e.valence < 0).map(e => e.date)).size;
    return { totalDays, totalEntries: total, avgValence: avgV, posDays, negDays };
  }, [entries, year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  return (
    <div className="app-container">
      {/* ===== LEFT PANEL ===== */}
      <div className="left-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 600, margin: 0, flex: '0 0 auto' }}>记一记</h2>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => switchTheme(t.key)}
                title={t.label}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: theme === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, lineHeight: 1,
                  opacity: theme === t.key ? 1 : 0.5,
                  transition: 'opacity 0.15s, border-color 0.15s',
                }}
              >{t.icon}</button>
            ))}
            {user?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)} className="btn-secondary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.7rem', margin: 0 }}>管理</button>
            )}
            <button onClick={onLogout} className="btn-secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.75rem', margin: 0 }}>退出</button>
          </div>
        </div>
        <RecordForm onSuccess={triggerRefresh} />
        <FeedbackTip refreshTrigger={refreshTrigger} />
        <ExportButton year={year} month={month} />
        <DataManagement />
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="right-panel">
        {/* Navigation Bar */}
        <div className="diary-nav">
          <button className="diary-nav-btn" onClick={prevMonth}>&#9664;</button>
          <span className="diary-month-label">{year}年 {month}月</span>
          <button className="diary-nav-btn" onClick={nextMonth}>&#9654;</button>
          <div className="diary-view-toggle">
            <span className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>月</span>
            <span className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>周</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="diary-stats-bar">
          <div className="diary-stat-chip">
            <div className="diary-stat-value">{monthStats.totalDays}</div>
            <div className="diary-stat-label">记录天数</div>
          </div>
          <div className="diary-stat-chip">
            <div className="diary-stat-value">{monthStats.totalEntries}</div>
            <div className="diary-stat-label">总条目</div>
          </div>
          <div className="diary-stat-chip">
            <div className="diary-stat-value" style={{
              color: monthStats.avgValence !== null
                ? (monthStats.avgValence >= 0 ? 'var(--success)' : 'var(--danger)')
                : 'var(--text-secondary)'
            }}>
              {monthStats.avgValence !== null
                ? (monthStats.avgValence >= 0 ? '+' : '') + monthStats.avgValence.toFixed(1)
                : '—'}
            </div>
            <div className="diary-stat-label">平均心情</div>
          </div>
          <div className="diary-stat-chip">
            <div className="diary-stat-value" style={{ color: 'var(--success)' }}>{monthStats.posDays}</div>
            <div className="diary-stat-label">积极天数</div>
          </div>
          <div className="diary-stat-chip">
            <div className="diary-stat-value" style={{ color: 'var(--danger)' }}>{monthStats.negDays}</div>
            <div className="diary-stat-label">消极天数</div>
          </div>
        </div>

        {/* Calendar + Detail + Trend Horizontal Split */}
        <div className="diary-content-row">
          <div className="diary-calendar-column">
            <CalendarView
              year={year} month={month} entries={entries}
              selectedDate={selectedDate} onSelectDate={setSelectedDate}
              viewMode={viewMode}
              onPrevMonth={prevMonth} onNextMonth={nextMonth}
            />
          </div>
          <div className="diary-detail-column">
            <div className="diary-detail-panel">
              <DetailPanel entries={entries} selectedDate={selectedDate} onUpdated={triggerRefresh} />
            </div>
          </div>
          <div className="diary-trend-column">
            <TrendChart entries={entries} />
          </div>
        </div>

        {/* Bottom Cards Row */}
        <div className="bottom-cards">
          <div className="bottom-card" onClick={() => setShowNetwork(true)}>
            <h4>🧠 认知模式图</h4>
            <p>查看你的核心认知循环与连接</p>
          </div>
          <div className="bottom-card" style={{ cursor: 'default' }}>
            <EmotionWeather />
          </div>
        </div>
      </div>

      {showNetwork && <NetworkModal onClose={() => setShowNetwork(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
