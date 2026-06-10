import React, { useRef } from 'react';
import DayCell from './DayCell';
import { getEmotionColor } from '../utils/emotionHelpers';

export default function CalendarView({ year, month, entries, selectedDate, onSelectDate, viewMode, onPrevMonth, onNextMonth }) {
  const touchStartX = useRef(0);
  const todayStr = new Date().toISOString().slice(0, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const adjFirst = firstDay === 0 ? 6 : firstDay - 1;
  const mStr = String(month).padStart(2, '0');

  const getDayAggregate = (dateStr) => {
    const dayEntries = entries.filter(e => e.date === dateStr);
    if (!dayEntries.length) return null;
    const avgV = dayEntries.reduce((s, e) => s + e.valence, 0) / dayEntries.length;
    const avgA = dayEntries.reduce((s, e) => s + e.arousal, 0) / dayEntries.length;
    return {
      valence: avgV,
      arousal: avgA,
      count: dayEntries.length,
      color: getEmotionColor(avgV, avgA),
    };
  };

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (onPrevMonth && onNextMonth) diff > 0 ? onPrevMonth() : onNextMonth();
    }
  };

  const renderDayCell = (dayNum) => {
    const day = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${day}`;
    const aggregate = getDayAggregate(dateStr);
    return (
      <DayCell
        key={dateStr}
        date={dateStr}
        aggregate={aggregate}
        isToday={dateStr === todayStr}
        isSelected={selectedDate === dateStr}
        onClick={() => onSelectDate(dateStr)}
      />
    );
  };

  if (viewMode === 'week') {
    const weeks = [];
    let ws = 1 - adjFirst;
    while (ws <= daysInMonth) {
      weeks.push(ws);
      ws += 7;
    }
    return (
      <div style={{ overflowY: 'auto', flex: 1 }}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {weeks.map((weekStart, wi) => {
          const wls = Math.max(1, weekStart);
          const wle = Math.min(weekStart + 6, daysInMonth);
          return (
            <div className="card" key={wi} style={{ padding: 8, marginBottom: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                {month}月{wls}日 — {wle}日
              </div>
              <div className="diary-calendar-grid">
                {Array.from({ length: 7 }, (_, wd) => {
                  const dn = weekStart + wd;
                  if (dn < 1 || dn > daysInMonth) {
                    return <div key={`empty-${wd}`} style={{ aspectRatio: '1', opacity: 0.2 }} />;
                  }
                  return renderDayCell(dn);
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="diary-calendar-grid">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className="diary-weekday-header">{d}</div>
        ))}
        {Array.from({ length: adjFirst }).map((_, i) => (
          <div key={`empty-${i}`} className="diary-day-cell other-month" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => renderDayCell(i + 1))}
      </div>
    </div>
  );
}
