export function TablifyMark({ size = 24 }: { size?: number }) {
  const r = size * 0.14
  const gap = size * 0.13
  const sq = (size - gap) / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <defs>
        <linearGradient id="tablify-mark-grad" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={sq} height={sq} rx={r} fill="url(#tablify-mark-grad)" />
      <rect x={sq + gap} y={0} width={sq} height={sq} rx={r} fill="url(#tablify-mark-grad)" />
      <rect x={0} y={sq + gap} width={sq} height={sq} rx={r} fill="url(#tablify-mark-grad)" opacity="0.4" />
      <rect x={sq + gap} y={sq + gap} width={sq} height={sq} rx={r} fill="url(#tablify-mark-grad)" opacity="0.4" />
    </svg>
  )
}

export function TablifyWordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <TablifyMark size={26} />
      <span className="text-base font-semibold tracking-tight">tablify</span>
    </div>
  )
}
