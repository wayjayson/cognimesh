export default function DayCell({ date, aggregate, isToday, isSelected, onClick }) {
  const dayNum = parseInt(date.slice(-2), 10);
  const cls = [
    'diary-day-cell',
    isToday && 'today',
    isSelected && 'selected',
    aggregate && 'has-record'
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={onClick}>
      <span>{dayNum}</span>
      {aggregate && (
        <div className="diary-emotion-dots">
          {Array.from({ length: Math.min(aggregate.count, 3) }, (_, i) => (
            <span key={i} className="diary-emotion-dot"
              style={{ background: aggregate.color, boxShadow: `0 0 4px ${aggregate.color}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
