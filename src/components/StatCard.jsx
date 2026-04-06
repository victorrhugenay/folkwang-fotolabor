export default function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="nm-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: '#888' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#303030' }}>{value}</p>
          {subtitle && <p className="text-xs mt-1" style={{ color: '#aaa' }}>{subtitle}</p>}
        </div>
        <div className="nm-icon h-11 w-11" style={{ borderRadius: '12px' }}>
          <Icon className="h-5 w-5" style={{ color: 'var(--nm-orange)' }} />
        </div>
      </div>
    </div>
  );
}