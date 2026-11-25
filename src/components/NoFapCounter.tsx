import HudIcon from './HudIcon';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import {
  getNoFapDays,
  fromDateInput,
  toDateInput,
  validateNoFapStart,
} from '../noFapUtils';

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function NoFapCounter() {
  const noFap = useStore(s => s.noFap);
  const startNoFap = useStore(s => s.startNoFap);
  const restartNoFap = useStore(s => s.restartNoFap);
  const setNoFapStart = useStore(s => s.setNoFapStart);

  const [now, setNow] = useState(() => Date.now());
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Minute resolution is enough: the counter only changes once a day
  useEffect(() => {
    if (!noFap) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [noFap]);

  const days = noFap ? getNoFapDays(noFap.startedAt, now) : 0;
  const bestDays = noFap ? Math.max(noFap.bestDays, days) : 0;

  const openEdit = () => {
    if (!noFap) return;
    setEditDate(toDateInput(noFap.startedAt));
    setEditError(null);
    setConfirmingReset(false);
    setEditing(true);
  };

  const saveEdit = () => {
    const start = fromDateInput(editDate);
    const error = validateNoFapStart(start, Date.now());
    if (error) {
      setEditError(error);
      return;
    }
    setNoFapStart(start);
    setEditing(false);
  };

  const handleReset = () => {
    restartNoFap();
    setNow(Date.now());
    setConfirmingReset(false);
  };

  return (
    <div className="fasting">
      <section className="fasting-card">
        <h2 className="fasting-title"><HudIcon name="shield" /> No fap</h2>

        <div className="nofap-counter" role="status" aria-label={`${days} ${days === 1 ? 'dia' : 'dias'} sem recaída`}>
          <span className="nofap-days">{days}</span>
          <span className="nofap-unit">{days === 1 ? 'dia' : 'dias'}</span>
        </div>

        {!noFap && (
          <>
            <p className="fasting-hint nofap-center">Comece sua contagem de dias.</p>
            <div className="fasting-actions">
              <button className="fasting-btn primary" onClick={startNoFap}><HudIcon name="play" /> Iniciar contagem</button>
            </div>
          </>
        )}

        {noFap && !confirmingReset && (
          <div className="fasting-actions">
            <button className="fasting-btn danger" onClick={() => { setConfirmingReset(true); setEditing(false); }}>
              ↺ Reiniciar contagem
            </button>
            <button className="fasting-btn" onClick={openEdit}><HudIcon name="edit" /> Ajustar data</button>
          </div>
        )}

        {noFap && confirmingReset && (
          <div className="fasting-confirm" role="alertdialog" aria-label="Confirmar reinício">
            <p>Reiniciar a contagem? Seu recorde de {bestDays} {bestDays === 1 ? 'dia' : 'dias'} será mantido.</p>
            <div className="fasting-actions">
              <button className="fasting-btn danger" onClick={handleReset}>Confirmar</button>
              <button className="fasting-btn" onClick={() => setConfirmingReset(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {noFap && editing && (
          <div className="fasting-edit">
            <label>
              Data de início
              <input type="date" value={editDate} max={toDateInput(now)} onChange={e => setEditDate(e.target.value)} />
            </label>
            {editError && <p className="fasting-error" role="alert">{editError}</p>}
            <div className="fasting-actions">
              <button className="fasting-btn primary" onClick={saveEdit}>Salvar</button>
              <button className="fasting-btn" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="fasting-meta">
          <div className="fasting-meta-card">
            <span className="fasting-meta-label">Início</span>
            <span className="fasting-meta-value">{noFap ? formatDate(noFap.startedAt) : '—'}</span>
          </div>
          <div className="fasting-meta-card">
            <span className="fasting-meta-label">Recorde</span>
            <span className="fasting-meta-value">{bestDays} {bestDays === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
