import React, { useState } from 'react';
import { fetchEmotionWeather } from '../api';
import toast from 'react-hot-toast';

const BUTTONS = [
  { type: 'instant', label: '即时回顾', icon: '⚡', desc: '近3日情绪觉察' },
  { type: 'period', label: '时段报告', icon: '📊', desc: '两周情绪故事' },
  { type: 'deep', label: '深度洞察', icon: '🔍', desc: '半年模式探索' },
];

function firstSentence(text) {
  const match = text.match(/^([^。！？\n]+)[。！？]?/);
  return match ? match[1] + '……' : text.slice(0, 40) + '……';
}

export default function EmotionWeather() {
  const [activeType, setActiveType] = useState(null);   // which button was pressed
  const [results, setResults] = useState({});            // { instant: '...', period: '...', deep: '...' }
  const [loading, setLoading] = useState({});            // { instant: true, ... }
  const [expanded, setExpanded] = useState({});          // { instant: true, ... }

  const load = async (type) => {
    setActiveType(type);
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const data = await fetchEmotionWeather(type);
      setResults(prev => ({ ...prev, [type]: data.result }));
      setExpanded(prev => ({ ...prev, [type]: false }));
    } catch (err) {
      toast.error(err.message || '获取失败');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const currentResult = activeType ? results[activeType] : null;
  const currentLoading = activeType ? loading[activeType] : false;
  const currentExpanded = activeType ? expanded[activeType] : false;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-heading)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        🌤️ 情绪天气
      </h4>

      {/* Three Buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {BUTTONS.map(b => {
          const isActive = activeType === b.type;
          const isLoading = loading[b.type];
          return (
            <button
              key={b.type}
              className="btn-secondary"
              onClick={() => load(b.type)}
              disabled={isLoading}
              title={b.desc}
              style={{
                flex: 1,
                width: 'auto',
                padding: '5px 8px',
                fontSize: '0.68rem',
                margin: 0,
                borderColor: isActive ? 'var(--accent)' : undefined,
                color: isActive ? 'var(--accent)' : undefined,
              }}
            >
              {isLoading ? '⏳' : b.icon} {b.label}
            </button>
          );
        })}
      </div>

      {/* Result Display */}
      {currentLoading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0 0 6px' }}>
          {activeType === 'instant' && '正在回顾近日情绪……'}
          {activeType === 'period' && '正在生成两周情绪报告……'}
          {activeType === 'deep' && '正在进行深度分析，请耐心等待……'}
        </p>
      )}

      {currentResult && !currentLoading && (
        <>
          <div style={{
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            fontSize: '0.7rem',
            margin: '0 0 6px',
            whiteSpace: currentExpanded ? 'pre-wrap' : 'normal',
            maxHeight: currentExpanded ? 'none' : '3em',
            overflow: currentExpanded ? 'visible' : 'hidden',
            transition: 'max-height 0.2s',
          }}>
            {currentExpanded ? currentResult : firstSentence(currentResult)}
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(prev => ({ ...prev, [activeType]: !prev[activeType] }));
            }}
            style={{
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              textDecoration: 'underline',
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            {currentExpanded ? '收起' : '展开'}
          </span>
        </>
      )}

      {!currentResult && !currentLoading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>
          即时回顾 · 时段报告 · 深度洞察
        </p>
      )}
    </div>
  );
}
