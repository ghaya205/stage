import './SlaCharts.css';

function polarPoint(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const p1 = polarPoint(cx, cy, rOuter, endAngle);
  const p2 = polarPoint(cx, cy, rOuter, startAngle);
  const p3 = polarPoint(cx, cy, rInner, startAngle);
  const p4 = polarPoint(cx, cy, rInner, endAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

function fmtPct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

/**
 * Donut chart ("camembert") for a fixed set of {label, value, color} segments.
 * Shows a center total and a compact legend with per-segment percentages.
 */
export function DonutChart({ title, segments, size = 132, centerLabel }) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  const r = size / 2;
  const rInner = r * 0.62;

  let angle = 0;
  const arcs = total > 0
    ? segments
        .filter((seg) => seg.value > 0)
        .map((seg) => {
          const start = angle;
          const sweep = (seg.value / total) * 360;
          angle += sweep;
          return { ...seg, start, end: angle };
        })
    : [];

  return (
    <div className="sla-donut">
      {title && <div className="sla-donut-title">{title}</div>}
      <div className="sla-donut-body">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="sla-donut-svg">
          {total === 0 && (
            <circle cx={r} cy={r} r={rInner + (r - rInner) / 2} fill="none" stroke="#EEF0F5" strokeWidth={r - rInner} />
          )}
          {arcs.map((seg) => (
            <path key={seg.label} d={arcPath(r, r, r, rInner, seg.start, seg.end)} fill={seg.color} />
          ))}
          <text x={r} y={r - 2} textAnchor="middle" className="sla-donut-center-value">
            {centerLabel ?? total}
          </text>
          <text x={r} y={r + 14} textAnchor="middle" className="sla-donut-center-sub">total</text>
        </svg>
        <ul className="sla-donut-legend">
          {segments.map((seg) => (
            <li key={seg.label}>
              <span className="sla-donut-dot" style={{ background: seg.color }} />
              <span className="sla-donut-legend-label">{seg.label}</span>
              <span className="sla-donut-legend-value">
                {seg.value}{total > 0 ? ` · ${fmtPct(seg.value / total)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Simple line/area "courbe" chart comparing two series (e.g. handled vs abandoned)
 * over a list of dates. Pure SVG, no dependency.
 */
export function TrendChart({ points, seriesA, seriesB, height = 220 }) {
  const width = 640;
  const padL = 40, padR = 12, padT = 16, padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  if (!points || points.length === 0) {
    return <div className="sla-trend-empty">No time-series data for this period yet.</div>;
  }

  const allValues = points.flatMap((p) => [p[seriesA.key] ?? 0, p[seriesB.key] ?? 0]);
  const maxV = Math.max(1, ...allValues);

  const x = (i) => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => padT + innerH - (v / maxV) * innerH;

  const linePath = (key) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p[key] ?? 0)}`).join(' ');

  const areaPath = (key) => {
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p[key] ?? 0)}`).join(' ');
    return `${line} L ${x(points.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  };

  const step = Math.max(1, Math.ceil(points.length / 7));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="sla-trend">
      <svg viewBox={`0 0 ${width} ${height}`} className="sla-trend-svg" preserveAspectRatio="none">
        {gridLines.map((g) => (
          <line key={g} x1={padL} x2={width - padR} y1={padT + innerH * (1 - g)} y2={padT + innerH * (1 - g)} className="sla-trend-grid" />
        ))}
        <path d={areaPath(seriesB.key)} fill={seriesB.color} opacity="0.10" />
        <path d={areaPath(seriesA.key)} fill={seriesA.color} opacity="0.10" />
        <path d={linePath(seriesB.key)} fill="none" stroke={seriesB.color} strokeWidth="2" />
        <path d={linePath(seriesA.key)} fill="none" stroke={seriesA.color} strokeWidth="2" />
        {points.map((p, i) => (
          i % step === 0 && (
            <text key={p.date} x={x(i)} y={height - 6} textAnchor="middle" className="sla-trend-axis-label">
              {p.date}
            </text>
          )
        ))}
        <text x={4} y={padT + 4} className="sla-trend-axis-label">{maxV}</text>
        <text x={4} y={padT + innerH} className="sla-trend-axis-label">0</text>
      </svg>
      <div className="sla-trend-legend">
        <span><span className="sla-donut-dot" style={{ background: seriesA.color }} /> {seriesA.label}</span>
        <span><span className="sla-donut-dot" style={{ background: seriesB.color }} /> {seriesB.label}</span>
      </div>
    </div>
  );
}
