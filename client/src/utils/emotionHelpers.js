export function getEmotionColor(v, a) {
  if (v > 1.5 && a > 5.5) return '#fbbf24';
  if (v > 1.5 && a <= 5.5) return '#4ade80';
  if (v < -1.5 && a > 5.5) return '#ef4444';
  if (v < -1.5 && a <= 5.5) return '#6366f1';
  if (Math.abs(v) <= 1.5 && a > 5.5) return '#f97316';
  if (Math.abs(v) <= 1.5 && a <= 5.5) return '#64748b';
  return v > 0 ? '#a3e635' : '#a78bfa';
}

export function getEmotionLabel(v, a) {
  if (v > 1.5 && a > 5.5) return '兴奋快乐';
  if (v > 1.5 && a <= 5.5) return '平静满足';
  if (v < -1.5 && a > 5.5) return '愤怒焦虑';
  if (v < -1.5 && a <= 5.5) return '悲伤消沉';
  if (Math.abs(v) <= 1.5 && a > 5.5) return '惊讶';
  if (Math.abs(v) <= 1.5 && a <= 5.5) return '中性';
  return v > 0 ? '愉悦' : '低落';
}

export function getEmotionEmoji(v, a) {
  if (v > 1.5 && a > 5.5) return '😊';
  if (v > 1.5 && a <= 5.5) return '😌';
  if (v < -1.5 && a > 5.5) return '😠';
  if (v < -1.5 && a <= 5.5) return '😢';
  if (Math.abs(v) <= 1.5 && a > 5.5) return '😲';
  if (Math.abs(v) <= 1.5 && a <= 5.5) return '😐';
  return v > 0 ? '🙂' : '😔';
}
