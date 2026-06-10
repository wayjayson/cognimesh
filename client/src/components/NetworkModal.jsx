import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Segment, useDefault } from 'segmentit';
import { getEmotionColor } from '../utils/emotionHelpers';
import { fetchRecentEntries } from '../api';

const segmentit = useDefault(new Segment());

const STOP_WORDS = new Set([
  '今天', '我们', '一个', '可以', '这个', '他们', '已经', '不是', '还是', '然后',
  '因为', '所以', '但是', '如果', '什么', '怎么', '这样', '那样', '没有', '这里',
  '那里', '自己', '知道', '感觉', '觉得', '可能', '应该', '时间', '时候', '一点',
  '一直', '一下', '一会', '这种', '那种', '问题', '事情', '一些', '所有', '任何',
  '更多', '全部', '最后', '首先', '目前'
]);

export default function NetworkModal({ onClose }) {
  const svgRef = useRef();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentEntries(100)
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => { setEntries([]); setLoading(false); });
  }, []);

  const buildGraph = React.useCallback(() => {
    // Use last 100 entries only
    const recent = entries.slice(-100);
    const nodeMap = new Map();
    const posMap = new Map(); // key: "valence,arousal" → track newest entry

    recent.forEach(e => {
      const words = segmentit.doSegment(e.thought + ' ' + e.situation, { simple: true });
      words.filter(w => w.length >= 2 && !STOP_WORDS.has(w)).forEach(w => {
        if (!nodeMap.has(w)) nodeMap.set(w, { id: w, label: w, count: 0, valenceSum: 0, arousalSum: 0, entries: [] });
        const node = nodeMap.get(w);
        node.count++;
        node.valenceSum += e.valence;
        node.arousalSum += e.arousal;
        node.entries.push(e);
      });
    });

    // Dedup by position: same valence+arousal coordinate → keep newest
    const deduped = [];
    const seen = new Map();
    const all = Array.from(nodeMap.values()).map(n => ({
      ...n,
      valence: +(n.valenceSum / n.count).toFixed(2),
      arousal: +(n.arousalSum / n.count).toFixed(2),
      roundValence: Math.round(n.valenceSum / n.count),
      roundArousal: Math.round(n.arousalSum / n.count),
    }));

    all.sort((a, b) => b.count - a.count);
    all.forEach(n => {
      const key = `${n.roundValence},${n.roundArousal}`;
      if (!seen.has(key)) {
        seen.set(key, n);
        deduped.push(n);
      }
    });

    return deduped.slice(0, 50);
  }, [entries]);

  useEffect(() => {
    if (!entries || !entries.length) return;
    const nodes = buildGraph();
    if (!nodes.length) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.append('text')
        .attr('x', 300).attr('y', 200)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)').attr('font-size', 13)
        .text('分词后未提取到足够关键词，请多记录一些日记内容');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 600, H = 420;
    const margin = { left: 52, right: 40, top: 28, bottom: 48 };
    const pw = W - margin.left - margin.right;
    const ph = H - margin.top - margin.bottom;

    const xScale = v => margin.left + (v + 5) / 10 * pw;
    const yScale = a => margin.top + (10 - a) / 10 * ph;

    const cx = xScale(0);
    const cy = yScale(5);

    const g = svg.append('g');

    // Quadrant backgrounds
    const quadrants = [
      { x: margin.left, y: margin.top, w: cx - margin.left, h: cy - margin.top, fill: 'rgba(239,68,68,0.06)' },
      { x: cx, y: margin.top, w: W - margin.right - cx, h: cy - margin.top, fill: 'rgba(251,191,36,0.06)' },
      { x: margin.left, y: cy, w: cx - margin.left, h: H - margin.bottom - cy, fill: 'rgba(99,102,241,0.08)' },
      { x: cx, y: cy, w: W - margin.right - cx, h: H - margin.bottom - cy, fill: 'rgba(74,222,128,0.06)' },
    ];
    g.selectAll('rect.quadrant').data(quadrants).join('rect')
      .attr('class', 'quadrant')
      .attr('x', d => d.x).attr('y', d => d.y)
      .attr('width', d => d.w).attr('height', d => d.h)
      .attr('fill', d => d.fill);

    // Quadrant emoji labels
    const qLabels = [
      { emoji: '😠', label: '愤怒·焦虑', x: margin.left + 38, y: margin.top + 22 },
      { emoji: '😊', label: '兴奋·快乐', x: cx + 38, y: margin.top + 22 },
      { emoji: '😢', label: '悲伤·消沉', x: margin.left + 38, y: H - margin.bottom - 14 },
      { emoji: '😌', label: '平静·满足', x: cx + 38, y: H - margin.bottom - 14 },
    ];
    g.selectAll('text.q-label').data(qLabels).join('text')
      .attr('class', 'q-label')
      .attr('x', d => d.x).attr('y', d => d.y)
      .attr('fill', 'var(--text-muted)').attr('font-size', 11)
      .attr('opacity', 0.7)
      .text(d => `${d.emoji} ${d.label}`);

    // Reference lines
    g.append('line').attr('x1', cx).attr('y1', margin.top).attr('x2', cx).attr('y2', H - margin.bottom)
      .attr('stroke', 'var(--text-muted)').attr('stroke-width', 1).attr('stroke-dasharray', '4,4').attr('opacity', 0.3);
    g.append('line').attr('x1', margin.left).attr('y1', cy).attr('x2', W - margin.right).attr('y2', cy)
      .attr('stroke', 'var(--text-muted)').attr('stroke-width', 1).attr('stroke-dasharray', '4,4').attr('opacity', 0.3);

    // Axis titles
    g.append('text').attr('x', W / 2).attr('y', H - 6).attr('fill', 'var(--text-muted)').attr('font-size', 11)
      .attr('text-anchor', 'middle').text('心情效价 Valence →');
    g.append('text').attr('x', 14).attr('y', H / 2).attr('fill', 'var(--text-muted)').attr('font-size', 11)
      .attr('text-anchor', 'middle').attr('transform', `rotate(-90, 14, ${H / 2})`)
      .text('精神唤醒 Arousal →');

    // Axis ticks
    [-5, 0, 5].forEach(v => {
      g.append('text').attr('x', xScale(v)).attr('y', H - margin.bottom + 16)
        .attr('fill', 'var(--text-muted)').attr('font-size', 10).attr('text-anchor', 'middle').text(v);
    });
    [0, 5, 10].forEach(a => {
      g.append('text').attr('x', margin.left - 8).attr('y', yScale(a) + 3)
        .attr('fill', 'var(--text-muted)').attr('font-size', 10).attr('text-anchor', 'end').text(a);
    });

    // Nodes (bubbles) — no labels, clickable
    const maxCount = d3.max(nodes, d => d.count) || 1;
    const rScale = d3.scaleLinear().domain([1, Math.max(2, maxCount)]).range([8, 28]);

    g.selectAll('circle.node').data(nodes).join('circle')
      .attr('class', 'node')
      .attr('cx', d => xScale(d.valence))
      .attr('cy', d => yScale(d.arousal))
      .attr('r', d => rScale(d.count))
      .attr('fill', d => getEmotionColor(d.valence, d.arousal))
      .attr('opacity', 0.85)
      .attr('stroke', 'var(--bg-input)')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.entries && d.entries.length > 0) {
          // Show the most recent entry for this keyword
          const latest = d.entries.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
          setSelectedEntry({ keyword: d.label, entry: latest });
        }
      })
      .append('title')
      .text(d => `${d.label} (${d.count}次)`)
      .style('pointer-events', 'none');

  }, [entries, buildGraph]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <h4>{'🧠'} 认知模式图</h4>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
          基于 Russell 情绪环状模型 — 关键词按效价 (Valence) 与唤醒度 (Arousal) 分布，反映你的认知-情绪联结模式
        </p>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>正在加载数据……</p>
        ) : !entries || entries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>暂无日记数据，开始记录后可生成认知模式图</p>
        ) : (
          <svg ref={svgRef} width="100%" height="420" viewBox="0 0 600 420"
            style={{ background: 'var(--bg-input)', borderRadius: 12, transition: 'background 0.3s' }} />
        )}

        {/* Clicked bubble → show diary card */}
        {selectedEntry && (
          <div style={{
            marginTop: 10,
            padding: 10,
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            border: '1px solid var(--border-light)',
            fontSize: '0.73rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: 'var(--accent)' }}>关键词: {selectedEntry.keyword}</strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSelectedEntry(null)}>✕</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: 4 }}>
              {selectedEntry.entry.date} {selectedEntry.entry.time}
            </div>
            <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedEntry.entry.thought || '(无文字)'}
            </div>
            {selectedEntry.entry.situation && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: 4 }}>
                情境: {selectedEntry.entry.situation}
              </div>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: 4 }}>
              效价: {selectedEntry.entry.valence} | 唤醒度: {selectedEntry.entry.arousal}
            </div>
          </div>
        )}

        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 12 }}>关闭</button>
      </div>
    </div>
  );
}
