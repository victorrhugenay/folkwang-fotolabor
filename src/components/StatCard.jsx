export default function StatCard({ icon: Icon, label, value, subtitle, color }) {
  const bg = color || 'var(--apple-orange)';
  const lightBg = color
    ? `${color}18`
    : 'var(--apple-orange-light)';

  return (
    <div className="apple-stat-card flex flex-col justify-between min-h-[140px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      </div>
      <div className="flex items-end justify-between mt-3">
        {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: lightBg }}
        >
          <Icon style={{ width: 18, height: 18, color: bg, minWidth: 18, minHeight: 18 }} />
        </div>
      </div>
    </div>
  );
}