import { useMemo, useState } from 'react';
import { useStore } from '../store';

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

export default function SprintImpediments() {
  const impediments = useStore(s => s.sprintImpediments);
  const addSprintImpediment = useStore(s => s.addSprintImpediment);
  const toggleSprintImpediment = useStore(s => s.toggleSprintImpediment);
  const deleteSprintImpediment = useStore(s => s.deleteSprintImpediment);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const openImpediments = useMemo(() => impediments.filter(item => !item.resolved), [impediments]);
  const resolvedImpediments = useMemo(() => impediments.filter(item => item.resolved), [impediments]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addSprintImpediment(title, details);
    setTitle('');
    setDetails('');
  };

  return (
    <section className="sprint-impediments" aria-labelledby="impediments-title">
      <header className="impediments-header">
        <div>
          <p className="impediments-kicker">SPRINT CONTROL // RISK MONITOR</p>
          <h2 id="impediments-title">Impedimentos</h2>
          <p>Centralize bloqueios que exigem acompanhamento para o sprint continuar fluindo.</p>
        </div>
        <span className="impediments-counter">{openImpediments.length} em aberto</span>
      </header>

      <form className="impediment-form" onSubmit={handleSubmit}>
        <label htmlFor="impediment-title">Novo impedimento</label>
        <input id="impediment-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: aguardando acesso ao ambiente de homologação" required />
        <textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="Contexto, responsável ou ação necessária (opcional)..." rows={3} />
        <button type="submit">Registrar impedimento</button>
      </form>

      <div className="impediment-list">
        <h3>Em aberto</h3>
        {openImpediments.length === 0 ? <p className="impediment-empty">Nenhum bloqueio ativo. Sprint com rota livre.</p> : openImpediments.map(item => (
          <article className="impediment-card" key={item.id}>
            <div className="impediment-card-main"><span className="impediment-status">BLOQUEIO</span><h4>{item.title}</h4>{item.details && <p>{item.details}</p>}<time>{formatDate(item.createdAt)}</time></div>
            <div className="impediment-actions"><button type="button" className="resolve-impediment" onClick={() => toggleSprintImpediment(item.id)}>Resolver</button><button type="button" className="delete-impediment" aria-label={`Excluir ${item.title}`} onClick={() => deleteSprintImpediment(item.id)}>×</button></div>
          </article>
        ))}
      </div>

      {resolvedImpediments.length > 0 && <div className="impediment-list resolved-list"><h3>Resolvidos</h3>{resolvedImpediments.map(item => (
        <article className="impediment-card resolved" key={item.id}><div className="impediment-card-main"><span className="impediment-status">RESOLVIDO</span><h4>{item.title}</h4>{item.details && <p>{item.details}</p>}<time>Resolvido em {item.resolvedAt ? formatDate(item.resolvedAt) : '—'}</time></div><div className="impediment-actions"><button type="button" className="reopen-impediment" onClick={() => toggleSprintImpediment(item.id)}>Reabrir</button><button type="button" className="delete-impediment" aria-label={`Excluir ${item.title}`} onClick={() => deleteSprintImpediment(item.id)}>×</button></div></article>
      ))}</div>}
    </section>
  );
}
