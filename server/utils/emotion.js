export function getEmotionLabel(v, a) {
  if (v > 1.5 && a > 5.5) return '兴奋';
  if (v > 1.5 && a <= 5.5) return '愉快';
  if (v < -1.5 && a > 5.5) return '焦虑';
  if (v < -1.5 && a <= 5.5) return '消沉';
  if (Math.abs(v) <= 1.5 && a > 5.5) return '紧张';
  if (Math.abs(v) <= 1.5 && a <= 5.5) return '平静';
  return v > 0 ? '愉悦' : '低落';
}
