import { useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { importSlaTargets, importSlaData } from '../../services/api';

export default function ImportPanel({ token, onImported }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleFile(e, kind) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = kind === 'targets' ? await importSlaTargets(token, file) : await importSlaData(token, file);
      if (res.error) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: `Imported ${res.imported} rows${res.skipped ? `, skipped ${res.skipped}` : ''}.` });
        onImported?.();
      }
    } catch {
      setMsg({ ok: false, text: 'Import failed — check the file and try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sla-import-panel">
      <label className="sla-import-btn">
        <Upload size={14} /> Import SLA targets (Sheet1 CSV)
        <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e, 'targets')} disabled={busy} />
      </label>
      <label className="sla-import-btn">
        <Upload size={14} /> Import raw interval data (CSV)
        <input type="file" accept=".csv" hidden onChange={(e) => handleFile(e, 'data')} disabled={busy} />
      </label>
      {busy && <span className="sla-import-status"><RefreshCw size={13} className="sla-spin" /> Importing…</span>}
      {msg && <span className={`sla-import-status ${msg.ok ? 'sla-import-status--ok' : 'sla-import-status--bad'}`}>{msg.text}</span>}
    </div>
  );
}
