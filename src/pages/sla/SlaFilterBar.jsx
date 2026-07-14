import { RefreshCw } from 'lucide-react';

// --------------------------------------------------------------------
// Helpers to turn Year / Month / Week / Day picks into a date_from/date_to
// range the backend already understands.
// --------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n) { return String(n).padStart(2, '0'); }

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Splits a month into Week 1..N (7-day chunks) for the "Weeks" filter. */
export function weeksInMonth(year, monthIndex) {
  const total = daysInMonth(year, monthIndex);
  const weeks = [];
  let start = 1;
  let w = 1;
  while (start <= total) {
    const end = Math.min(start + 6, total);
    weeks.push({ label: `Week ${w}`, start, end });
    start = end + 1;
    w += 1;
  }
  return weeks;
}

/** Builds { dateFrom, dateTo } (YYYY-MM-DD) from the filter state, or nulls for "All". */
export function computeDateRange({ year, month, week, dayNum }) {
  if (year && month !== '' && dayNum) {
    const y = Number(year);
    const m = Number(month);
    const dateStr = `${y}-${pad(m + 1)}-${pad(Number(dayNum))}`;
    return { dateFrom: dateStr, dateTo: dateStr };
  }

  if (year && month !== '' && week !== '') {
    const y = Number(year);
    const m = Number(month);
    const weeks = weeksInMonth(y, m);
    const wk = weeks[Number(week)];
    if (wk) {
      return {
        dateFrom: `${y}-${pad(m + 1)}-${pad(wk.start)}`,
        dateTo: `${y}-${pad(m + 1)}-${pad(wk.end)}`,
      };
    }
  }

  if (year && month !== '') {
    const y = Number(year);
    const m = Number(month);
    return {
      dateFrom: `${y}-${pad(m + 1)}-01`,
      dateTo: `${y}-${pad(m + 1)}-${pad(daysInMonth(y, m))}`,
    };
  }

  if (year) {
    return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
  }

  return { dateFrom: null, dateTo: null };
}

const YEARS = [2024, 2025, 2026];

export default function SlaFilterBar({
  activeTab, onTabChange,
  filters, onFiltersChange,
  desks = [], companies = [], showCompanyFilter = false,
  onRefresh, loading,
}) {
  function set(field, value) {
    const next = { ...filters, [field]: value };
    // Reset dependent fields when a parent changes.
    if (field === 'year') { next.month = ''; next.week = ''; next.dayNum = ''; }
    if (field === 'month') { next.week = ''; next.dayNum = ''; }
    if (field === 'week') { next.dayNum = ''; }
    onFiltersChange(next);
  }

  const weekOptions = filters.year && filters.month !== ''
    ? weeksInMonth(Number(filters.year), Number(filters.month))
    : [];

  const dayCount = filters.year && filters.month !== ''
    ? daysInMonth(Number(filters.year), Number(filters.month))
    : 31;

  return (
    <div className="sla-filterbar">
      <div className="sla-filterbar-tabs">
        <button
          type="button"
          className={`sla-filterbar-tab${activeTab === 'realtime' ? ' active' : ''}`}
          onClick={() => onTabChange('realtime')}
        >
          Real Time Data
        </button>
        <button
          type="button"
          className={`sla-filterbar-tab${activeTab === 'historical' ? ' active' : ''}`}
          onClick={() => onTabChange('historical')}
        >
          Historical Data
        </button>
      </div>

      <div className="sla-filterbar-controls">
        <select className="sla-select" value={filters.year} onChange={(e) => set('year', e.target.value)}>
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select className="sla-select" value={filters.month} onChange={(e) => set('month', e.target.value)} disabled={!filters.year}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>

        <select className="sla-select" value={filters.week} onChange={(e) => set('week', e.target.value)} disabled={!filters.year || filters.month === ''}>
          <option value="">All Weeks</option>
          {weekOptions.map((w, i) => <option key={w.label} value={i}>{w.label}</option>)}
        </select>

        <select
          className="sla-select"
          value={filters.dayNum}
          onChange={(e) => set('dayNum', e.target.value)}
          disabled={!filters.year || filters.month === ''}
        >
          <option value="">All Days</option>
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="sla-select" value={filters.deskName} onChange={(e) => set('deskName', e.target.value)}>
          <option value="">All Desks</option>
          {desks.map((d) => <option key={d.id ?? d.name} value={d.name}>{d.name}</option>)}
        </select>

        {showCompanyFilter && (
          <select className="sla-select" value={filters.companyId} onChange={(e) => set('companyId', e.target.value)}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <button type="button" className="sla-refresh-btn" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'sla-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  );
}

export function emptyFilters() {
  return { year: '', month: '', week: '', day: '', dayNum: '', deskName: '', companyId: '' };
}
