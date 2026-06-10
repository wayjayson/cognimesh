import React, { useState } from 'react';
import { exportDiaryCSV } from '../api';

export default function ExportButton({ year, month }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      className="card"
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
      onClick={async () => { if (loading) return; setLoading(true); await exportDiaryCSV(year, month); setLoading(false); }}
    >
      <h4 style={{ margin: 0 }}>导出本月CSV</h4>
      <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{loading ? '导出中...' : '下载当前月日记'}</p>
    </button>
  );
}
