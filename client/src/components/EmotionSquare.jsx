import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function EmotionSquare({ valence, arousal, onChange }) {
  const containerRef = useRef(null);
  const [localV, setLocalV] = useState(valence);
  const [localA, setLocalA] = useState(arousal);

  useEffect(() => { setLocalV(valence); setLocalA(arousal); }, [valence, arousal]);

  const update = useCallback((xRatio, yRatio) => {
    const v = Math.round(((xRatio * 10) - 5) * 10) / 10;
    const a = Math.round((1 - yRatio) * 10 * 10) / 10;
    setLocalV(v); setLocalA(a);
    onChange(v, a);
  }, [onChange]);

  const move = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left, y = clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    update(x / rect.width, y / rect.height);
  }, [update]);

  const handleStart = (e) => {
    e.preventDefault();
    const pos = e.touches ? e.touches[0] : e;
    move(pos.clientX, pos.clientY);
    const onMove = (ev) => { const p = ev.touches ? ev.touches[0] : ev; move(p.clientX, p.clientY); };
    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div>
      <div className="emotion-square-container" ref={containerRef} tabIndex={0} role="slider"
        aria-label="情绪坐标，拖拽调整"
        aria-valuemin={-5} aria-valuemax={5} aria-valuenow={localV}
        aria-valuetext={`心情效价 ${localV}，唤醒度 ${localA.toFixed(1)}`}
        onMouseDown={handleStart} onTouchStart={handleStart}>
        <div className="square-bg">
          <div className="quadrant q-top-left">
            <span className="quadrant-emoji" style={{ top: 6, left: 6 }}>😠</span>
            <span className="axis-label" style={{ bottom: 4, left: 4 }}>紧张·愤怒</span>
          </div>
          <div className="quadrant q-top-right">
            <span className="quadrant-emoji" style={{ top: 6, right: 6 }}>😊</span>
            <span className="axis-label" style={{ bottom: 4, right: 4 }}>兴奋·快乐</span>
          </div>
          <div className="quadrant q-bottom-left">
            <span className="quadrant-emoji" style={{ bottom: 6, left: 6 }}>😢</span>
            <span className="axis-label" style={{ top: 4, left: 4 }}>悲伤·消沉</span>
          </div>
          <div className="quadrant q-bottom-right">
            <span className="quadrant-emoji" style={{ bottom: 6, right: 6 }}>😌</span>
            <span className="axis-label" style={{ top: 4, right: 4 }}>平静·放松</span>
          </div>
        </div>
        <div className="emotion-dot" style={{ left: `${((localV+5)/10)*100}%`, top: `${(1-localA/10)*100}%` }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
        心情 {localV > 0 ? '+' + localV : localV} · 精神 {localA.toFixed(1)}
      </div>
    </div>
  );
}
