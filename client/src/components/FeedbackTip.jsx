import React, { useEffect, useState, useRef } from 'react';
import { fetchDiaryMonth } from '../api';

export default function FeedbackTip({ refreshTrigger }) {
  const [tip, setTip] = useState('记录下此刻的感受，开始自我觉察');
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (Date.now() - lastFetchRef.current < 30000) return;
    lastFetchRef.current = Date.now();
    const today = new Date();
    fetchDiaryMonth(today.getFullYear(), today.getMonth() + 1)
      .then(data => {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const recent = data.entries.filter(e => new Date(e.date) >= threeDaysAgo);
        if (!recent.length) { setTip('记录下此刻的感受，开始自我觉察'); return; }
        const avgV = recent.reduce((s, e) => s + e.valence, 0) / recent.length;
        const avgA = recent.reduce((s, e) => s + e.arousal, 0) / recent.length;
        if (avgV < -2) setTip('感觉不太好吗？试试写下三件让你心存感激的小事');
        else if (avgA > 7) setTip('情绪波动较大时，尝试腹式呼吸：吸气4秒，屏息4秒，呼气6秒');
        else if (avgV > 2) setTip('心情不错！不妨把这份积极体验分享给一位朋友');
        else setTip('继续记录，你会更了解自己的情绪模式');
      }).catch(() => {});
  }, [refreshTrigger]);

  return <div className="feedback-tip">{tip}</div>;
}
