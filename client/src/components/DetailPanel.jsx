import React, { useState } from 'react';
import { updateDiaryEntry, deleteDiaryEntry } from '../api';
import toast from 'react-hot-toast';
import EditModal from './EditModal';
import { getEmotionColor, getEmotionLabel, getEmotionEmoji } from '../utils/emotionHelpers';

export default function DetailPanel({ entries, selectedDate, onUpdated }) {
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const filtered = entries.filter(e => e.date === selectedDate);

  if (!selectedDate) return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <p style={{ color: 'var(--text-muted)' }}>选择日期查看记录</p>
    </div>
  );

  const handleDelete = async () => {
    try {
      await deleteDiaryEntry(deleteId);
      toast.success('已删除');
      onUpdated();
    } catch (err) { toast.error('删除失败'); }
    setDeleteId(null);
  };

  return (
    <>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
          <div style={{ fontSize: '2rem' }}>📭</div>
          <div>{selectedDate}</div>
          <div>暂无记录</div>
        </div>
      ) : (
        filtered.map(e => (
          <div key={e._id} className="diary-entry-card"
            style={{ borderLeftColor: getEmotionColor(e.valence, e.arousal) }}>
            <div className="diary-entry-time">🕐 {e.time || '—'}</div>
            <div>{e.situation}</div>
            <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{e.thought}"</div>
            <span style={{ fontSize: '0.62rem', background: 'rgba(109,99,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>
              {getEmotionEmoji(e.valence, e.arousal)} {getEmotionLabel(e.valence, e.arousal)} · 心情{e.valence > 0 ? '+' + e.valence : e.valence} 精神{e.arousal.toFixed(1)}
            </span>
            <div className="detail-entry-actions">
              <button className="btn-secondary" onClick={() => setEditingId(e._id)}>编辑</button>
              <button className="btn-danger" onClick={() => setDeleteId(e._id)}>删除</button>
            </div>
          </div>
        ))
      )}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p>确认删除该条记录吗？</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>取消</button>
              <button className="btn-danger" onClick={handleDelete}>确认</button>
            </div>
          </div>
        </div>
      )}
      {editingId && (
        <EditModal
          entry={entries.find(e => e._id === editingId)}
          onSave={async (data) => { await updateDiaryEntry(editingId, data); onUpdated(); setEditingId(null); }}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
