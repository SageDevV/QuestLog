import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from '../store';
import {
  FAST_PHASES,
  FAST_PROTOCOLS,
  CUSTOM_PROTOCOL_ID,
  DEFAULT_PROTOCOL_ID,
  MIN_TARGET_HOURS,
  MAX_TARGET_HOURS,
  HOUR_MS,
  getProtocolHours,
  matchProtocolId,
  protocolLabel,
  formatHours,
  getFastProgress,
  getFastPhase,
  getFastStreak,
  getWeekSummary,
  isFastCompleted,
  formatClock,
  formatDurationShort,
  validateFastTimes,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../fastingUtils';

const RING_SIZE = 260;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function FastingTimer() {
  const activeFast = useStore(s => s.activeFast);
  const fastHistory = useStore(s => s.fastHistory);
  const startFast = useStore(s => s.startFast);
  const updateFast = useStore(s => s.updateFast);
  const endFast = useStore(s => s.endFast);

  const now = useNow(activeFast !== null);

  const [idleProtocolId, setIdleProtocolId] = useState(DEFAULT_PROTOCOL_ID);
  const [idleHours, setIdleHours] = useState(getProtocolHours(DEFAULT_PROTOCOL_ID) ?? 16);
  const [customText, setCustomText] = useState('');
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const protocolId = activeFast ? activeFast.protocolId : idleProtocolId;
  const targetHours = activeFast ? activeFast.targetHours : idleHours;
  const isCustom = protocolId === CUSTOM_PROTOCOL_ID;

  // Keeps the custom input in sync when the target changes elsewhere (e.g. manual time edit)
  useEffect(() => {
    if (isCustom && Number(customText) !== targetHours) setCustomText(formatHours(targetHours));
  }, [isCustom, targetHours]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = activeFast ? getFastProgress(activeFast.startedAt, targetHours, now) : null;
  const reached = progress?.reached ?? false;
  const phase = getFastPhase(progress?.elapsedMs ?? 0);

  // Celebrate only when the goal is crossed while the screen is open
  const reachedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!activeFast) {
      reachedRef.current = null;
      return;
    }
    if (reachedRef.current === false && reached) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#10b981', '#facc15', '#ffffff'], zIndex: 10000 });
    }
    reachedRef.current = reached;
  }, [activeFast, reached]);

  const applyTarget = (id: string, hours: number) => {
    if (activeFast) updateFast({ protocolId: id, targetHours: hours });
    else {
      setIdleProtocolId(id);
      setIdleHours(hours);
    }
  };

  const handleSelectProtocol = (id: string) => {
    if (id === CUSTOM_PROTOCOL_ID) {
      setCustomText(formatHours(targetHours));
      applyTarget(CUSTOM_PROTOCOL_ID, targetHours);
    } else {
      applyTarget(id, getProtocolHours(id) ?? targetHours);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    const hours = Number(text);
    if (text !== '' && hours >= MIN_TARGET_HOURS && hours <= MAX_TARGET_HOURS) {
      applyTarget(CUSTOM_PROTOCOL_ID, hours);
    }
  };

  const openEdit = () => {
    if (!activeFast) return;
    setEditStart(toDateTimeLocal(activeFast.startedAt));
    setEditEnd(toDateTimeLocal(activeFast.startedAt + activeFast.targetHours * HOUR_MS));
    setEditError(null);
    setConfirmingEnd(false);
    setEditing(true);
  };

  const saveEdit = () => {
    const start = fromDateTimeLocal(editStart);
    const end = fromDateTimeLocal(editEnd);
    const error = validateFastTimes(start, end, Date.now());
    if (error) {
      setEditError(error);
      return;
    }
    const hours = Math.round(((end - start) / HOUR_MS) * 100) / 100;
    updateFast({ startedAt: start, targetHours: hours, protocolId: matchProtocolId(hours) });
    setEditing(false);
  };

  const handleEnd = () => {
    endFast();
    setConfirmingEnd(false);
    setEditing(false);
  };

  const streak = getFastStreak(fastHistory, now);
  const week = getWeekSummary(fastHistory, now);
  const recent = fastHistory.slice(0, 5);
  const eatingHours = Math.max(0, 24 - targetHours);
  const endsAt = activeFast ? activeFast.startedAt + activeFast.targetHours * HOUR_MS : null;

  const gradientId = reached ? 'fast-grad-done' : 'fast-grad';

  return (
    <div className="fasting">
      <section className={`fasting-card${reached ? ' reached' : ''}`}>
        <h2 className="fasting-title">⏱️ Jejum Intermitente</h2>

        <div className="fasting-protocols" role="radiogroup" aria-label="Protocolo de jejum">
          {FAST_PROTOCOLS.map(p => (
            <button
              key={p.id}
              role="radio"
              aria-checked={protocolId === p.id}
              className={`fasting-chip${protocolId === p.id ? ' selected' : ''}`}
              onClick={() => handleSelectProtocol(p.id)}
            >
              {p.label}
            </button>
          ))}
          <button
            role="radio"
            aria-checked={isCustom}
            className={`fasting-chip${isCustom ? ' selected' : ''}`}
            onClick={() => handleSelectProtocol(CUSTOM_PROTOCOL_ID)}
          >
            Personalizada
          </button>
        </div>

        {isCustom && (
          <label className="fasting-custom">
            Horas de jejum
            <input
              type="number"
              min={MIN_TARGET_HOURS}
              max={MAX_TARGET_HOURS}
              step="0.5"
              value={customText}
              onChange={e => handleCustomChange(e.target.value)}
            />
            <span className="fasting-hint">{MIN_TARGET_HOURS}–{MAX_TARGET_HOURS}h</span>
          </label>
        )}
        <p className="fasting-hint fasting-window">
          Jejum de {formatHours(targetHours)}h · janela alimentar de {formatHours(eatingHours)}h
        </p>

        <div
          className="fasting-ring"
          role="progressbar"
          aria-label="Progresso do jejum"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, progress?.percent ?? 0)}
        >
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden="true">
            <defs>
              <linearGradient id="fast-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#e94560" />
              </linearGradient>
              <linearGradient id="fast-grad-done" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
            <circle className="fasting-ring-track" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} strokeWidth={RING_STROKE} />
            <circle
              className="fasting-ring-progress"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              strokeWidth={RING_STROKE}
              stroke={`url(#${gradientId})`}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - (progress?.ratio ?? 0))}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </svg>
          <div className="fasting-ring-center">
            {progress ? (
              <>
                <span className="fasting-ring-label">Decorrido</span>
                <span className="fasting-elapsed">{formatClock(progress.elapsedMs)}</span>
                <span className="fasting-percent">{progress.percent}%</span>
                <span className="fasting-remaining">
                  {reached ? `+${formatClock(progress.overtimeMs)} de bônus` : `Restam ${formatClock(progress.remainingMs)}`}
                </span>
              </>
            ) : (
              <>
                <span className="fasting-ring-label">Pronto para começar</span>
                <span className="fasting-elapsed">{formatClock(0)}</span>
                <span className="fasting-percent">Meta: {formatHours(targetHours)}h</span>
              </>
            )}
          </div>
        </div>

        {reached && (
          <div className="fasting-achievement" role="status">
            🏆 Meta atingida! Você completou {protocolLabel(protocolId, targetHours)}. Cada minuto extra é bônus.
          </div>
        )}

        <div className="fasting-actions">
          {!activeFast && (
            <button className="fasting-btn primary" onClick={() => startFast(protocolId, targetHours)}>
              ▶ Iniciar jejum
            </button>
          )}
          {activeFast && !confirmingEnd && (
            <>
              <button className="fasting-btn danger" onClick={() => { setConfirmingEnd(true); setEditing(false); }}>
                ⏹ Encerrar jejum
              </button>
              <button className="fasting-btn" onClick={openEdit}>✏️ Ajustar horários</button>
            </>
          )}
        </div>

        {activeFast && confirmingEnd && progress && (
          <div className="fasting-confirm" role="alertdialog" aria-label="Confirmar encerramento">
            <p>
              Encerrar com {formatDurationShort(progress.elapsedMs)} de {formatHours(targetHours)}h ({progress.percent}%)?
              {!reached && ' A meta ainda não foi atingida e o jejum ficará como parcial.'}
            </p>
            <div className="fasting-actions">
              <button className="fasting-btn danger" onClick={handleEnd}>Confirmar</button>
              <button className="fasting-btn" onClick={() => setConfirmingEnd(false)}>Continuar jejum</button>
            </div>
          </div>
        )}

        {activeFast && editing && (
          <div className="fasting-edit">
            <label>
              Início
              <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} />
            </label>
            <label>
              Meta de término
              <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
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
            <span className="fasting-meta-label">Início do jejum</span>
            <span className="fasting-meta-value">{activeFast ? formatDateTime(activeFast.startedAt) : '—'}</span>
          </div>
          <div className="fasting-meta-card">
            <span className="fasting-meta-label">Meta de término</span>
            <span className="fasting-meta-value">
              {endsAt !== null
                ? formatDateTime(endsAt)
                : `Iniciando agora: ${formatDateTime(Date.now() + targetHours * HOUR_MS)}`}
            </span>
          </div>
        </div>
      </section>

      <section className="fasting-card">
        <h3 className="fasting-subtitle">Fase metabólica</h3>
        <ol className="fasting-phases">
          {FAST_PHASES.map(p => (
            <li
              key={p.fromHours}
              className={`fasting-phase${activeFast && p.fromHours === phase.fromHours ? ' current' : ''}`}
              aria-current={activeFast && p.fromHours === phase.fromHours ? 'step' : undefined}
            >
              <span aria-hidden="true">{p.icon}</span>
              <span className="fasting-phase-hours">{p.fromHours}h+</span>
            </li>
          ))}
        </ol>
        <p className="fasting-phase-text">
          <strong>{phase.icon} {phase.title}</strong>
          {activeFast ? ` — ${phase.description}` : ' — Inicie um jejum para acompanhar as fases.'}
        </p>
        <p className="fasting-hint">Estimativas gerais que variam por pessoa. Não substituem orientação de um profissional de saúde.</p>
      </section>

      <section className="fasting-card">
        <h3 className="fasting-subtitle">
          Histórico
          <span className="fasting-streak" title="Dias seguidos com jejum concluído">🔥 {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        </h3>
        <div className="fasting-week">
          {week.map(d => (
            <div key={d.key} className={`fasting-day ${d.status}${d.isToday ? ' today' : ''}`}>
              <span className="fasting-day-name">{d.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
              <span
                className="fasting-day-mark"
                role="img"
                aria-label={d.status === 'completed' ? 'Jejum concluído' : d.status === 'partial' ? 'Jejum parcial' : 'Sem jejum'}
              >
                {d.status === 'completed' ? '✅' : d.status === 'partial' ? '◐' : '·'}
              </span>
              <span className="fasting-day-num">{d.date.getDate()}</span>
            </div>
          ))}
        </div>
        {recent.length === 0 ? (
          <p className="fasting-hint">Nenhum jejum registrado ainda.</p>
        ) : (
          <ul className="fasting-history">
            {recent.map(r => (
              <li key={r.id}>
                <span>{isFastCompleted(r) ? '✅' : '◐'} {protocolLabel(r.protocolId, r.targetHours)}</span>
                <span>{formatDurationShort(r.endedAt - r.startedAt)} de {formatHours(r.targetHours)}h</span>
                <span className="fasting-hint">{new Date(r.endedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
