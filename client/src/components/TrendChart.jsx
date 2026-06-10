import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function TrendChart({ entries }) {
  const dailyData = React.useMemo(() => {
    const map = {};
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = { date: e.date, valenceSum: 0, arousalSum: 0, count: 0 };
      map[e.date].valenceSum += e.valence;
      map[e.date].arousalSum += e.arousal;
      map[e.date].count++;
    });
    return Object.values(map).map(d => ({
      date: d.date.slice(5),
      valence: +(d.valenceSum / d.count).toFixed(2),
      arousal: +(d.arousalSum / d.count).toFixed(1),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  if (dailyData.length < 2) return (
    <div className="card" style={{ textAlign: 'center', padding: 24 }}>
      <span style={{ fontSize: 32 }}>✨</span>
      <h4>写下你的日记，解锁本月情绪趋势</h4>
      <p style={{ color: 'var(--text-muted)' }}>坚持记录两天以上，这里会呈现你的情绪曲线</p>
    </div>
  );

  return (
    <div className="card">
      <h4>本月情绪趋势</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--chart-axis)', fontSize: 10 }} />
          <YAxis yAxisId="left" domain={[-5, 5]} tick={{ fill: 'var(--chart-axis)' }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: 'var(--chart-axis)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
            }}
          />
          <ReferenceLine yAxisId="left" y={0} stroke="var(--chart-reference)" />
          <Line yAxisId="left" type="monotone" dataKey="valence" stroke="var(--chart-valence)" strokeWidth={3} name="心情效价" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="arousal" stroke="var(--chart-arousal)" strokeWidth={3} strokeDasharray="5 5" name="唤醒度" dot={false} />
          <Legend
            wrapperStyle={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>实线心情 · 虚线精神</p>
    </div>
  );
}
