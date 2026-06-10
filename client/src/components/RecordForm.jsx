import React, { useState } from 'react';
import EmotionSquare from './EmotionSquare';
import { createDiaryEntry } from '../api';
import toast from 'react-hot-toast';

export default function RecordForm({ onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(5);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createDiaryEntry({ date, time, situation, thought, valence, arousal });
      toast.success('记录成功');
      onSuccess();
      setSituation('');
      setThought('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h4>新记录</h4>
      <form onSubmit={handleSubmit} className="record-form">
        <div className="form-row-inline">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
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
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}
