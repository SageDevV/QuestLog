import { useMemo } from 'react';
import { useStore } from '../store';

const TIME_CLOCK_URL = 'https://platform.senior.com.br/senior-x/#/Gest%C3%A3o%20de%20Pessoas%20%7C%20HCM/1/res:%2F%2Fsenior.com.br%2Fhcm%2Fpontomobile%2FclockingEvent?category=frame&link=https:%2F%2Fplatform.senior.com.br%2Fhcm-pontomobile%2Fhcm%2Fpontomobile%2F%23%2Fclocking-event&withCredentials=true&r=1';

const SCHEDULE = [
  { label: 'Entrada', time: '08:00', tone: 'cyan' },
  { label: 'Saída almoço', time: '12:00', tone: 'pink' },
  { label: 'Retorno', time: '13:12', tone: 'violet' },
  { label: 'Saída', time: '18:00', tone: 'cyan' },
];

function sameLocalDay(timestamp: number, date: Date): boolean {
  const value = new Date(timestamp);
  return value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth() && value.getDate() === date.getDate();
}

export default function TimeClock() {
  const accesses = useStore(s => s.timeClockPortalAccesses);
  const recordPortalAccess = useStore(s => s.recordTimeClockPortalAccess);
  const today = new Date();
  const todayAccesses = useMemo(() => accesses.filter(access => sameLocalDay(access.accessedAt, today)), [accesses, today.getFullYear(), today.getMonth(), today.getDate()]);
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(today);

  return (
    <section className="time-clock" aria-labelledby="time-clock-title">
      <header className="time-clock-header">
        <div>
          <p className="time-clock-kicker">HCM LINK // JORNADA DE TRABALHO</p>
          <h2 id="time-clock-title">Controle de Ponto</h2>
          <p>Consulte sua jornada e acesse o Portal Senior para efetuar a marcação oficial.</p>
        </div>
        <time>{dateLabel}</time>
      </header>

      <div className="time-clock-schedule">
        <div className="time-clock-schedule-heading"><span>Escala administrativa</span><strong>08h48 de jornada</strong></div>
        <div className="time-clock-slots">
          {SCHEDULE.map(slot => <div key={slot.label} className={`time-clock-slot ${slot.tone}`}><span>{slot.label}</span><strong>{slot.time}</strong></div>)}
        </div>
        <p className="time-clock-break">Intervalo previsto: <strong>1h12</strong> · mínimo legal: 1h</p>
      </div>

      <a className="time-clock-action" href={TIME_CLOCK_URL} onClick={recordPortalAccess}>
        <span className="time-clock-action-icon" aria-hidden="true">◷</span>
        <span><strong>Registrar ponto no Portal Senior</strong><small>Abrir marcação oficial</small></span>
        <b aria-hidden="true">↗</b>
      </a>

      <div className="time-clock-history">
        <h3>Acessos de hoje</h3>
        <p className="time-clock-disclaimer">Este histórico registra apenas os acessos feitos pelo MissionLog. A confirmação da marcação ocorre no Portal Senior.</p>
        {todayAccesses.length === 0 ? <p className="time-clock-empty">Nenhum acesso ao portal registrado hoje.</p> : <ul>{todayAccesses.map(access => <li key={access.id}><span>Portal de ponto acionado</span><time>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(access.accessedAt))}</time></li>)}</ul>}
      </div>
    </section>
  );
}
