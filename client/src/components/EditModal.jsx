import React, { useState } from 'react';
import EmotionSquare from './EmotionSquare';
import toast from 'react-hot-toast';

export default function EditModal({ entry, onSave, onClose }) {
  const [date, setDate] = useState(entry.date || '');
  const [time, setTime] = useState(entry.time || '');
  const [situation, setSituation] = useState(entry.situation || '');
  const [thought, setThought] = useState(entry.thought || '');
  const [valence, setValence] = useState(entry.valence ?? 0);
  const [arousal, setArousal] = useState(entry.arousal ?? 5);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('日期和时间不能为空');
      return;
    }
    setSaving(true);
    try {
      await onSave({ date, time, situation, thought, valence, arousal });
      toast.success('已更新');
      onClose();
    } catch (err) {
      toast.error(err.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h4>编辑记录</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-row-inline">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </div>
          <EmotionSquare valence={valence} arousal={arousal} onChange={(v, a) => { setValence(v); setArousal(a); }} />
          <div className="form-row">
            <textarea
              placeholder="情境 (可选)"
              value={situation}
              onChange={e => setSituation(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>
          <div className="form-row">
            <textarea
              placeholder="想法/感受..."
              value={thought}
              onChange={e => setThought(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
