import { useStore } from '../store';

const ITEMS = [
  { name: 'Potion of Focus (Double XP 30m)', cost: 50, emoji: '🧪', type: 'item' },
  { name: 'Smoke Bomb (Pular missão amarga)', cost: 130, emoji: '💨', type: 'item' },
  { name: 'Mega Resurrect (Trazer vida)', cost: 400, emoji: '🧬', type: 'item' },
  { name: 'Acesso VIP', cost: 1000, emoji: '💳', type: 'item' },
  { name: 'Estilo: Crimson Ninja (Vermelho)', cost: 250, emoji: '🔴', type: 'bg' },
  { name: 'Estilo: Matrix Hacker (Verde)', cost: 250, emoji: '🟢', type: 'bg' },
];

export default function ShopTavern() {
  const { hero, buyShopItem } = useStore();

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#facc15', fontFamily: 'Orbitron', fontSize:'1.6rem', textShadow:'0 0 10px rgba(250, 204, 21, 0.4)' }}>🍻 Taverna do Aventureiro</h2>
        <p style={{ color: '#8892b0' }}>A bolsa de moedas retine com <strong style={{ color: '#00e5ff' }}>⚡ {hero.gold} Pedaços de Ouro</strong></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(140px, 1fr)', gap: '15px' }}>
        {ITEMS.map(item => {
          const isBg = item.type === 'bg';
          const purchased = isBg ? hero.bgUnlocked.includes(item.name) : false;

          return (
            <div key={item.name} className="quest-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding:'15px 10px', transition:'transform 0.1s' }}>
              <span style={{ fontSize: '2.5rem', marginBottom:'8px' }}>{item.emoji}</span>
              <strong style={{ margin: '10px 0', fontSize: '0.85rem', color: '#eee', height:'35px' }}>{item.name}</strong>
              {purchased ? (
                <button disabled style={{ background: '#222', color: '#666', border: 'none', padding: '8px 15px', borderRadius: '5px', width:'100%' }}>Comprado</button>
              ) : (
                <button
                  onClick={() => {
                    const success = buyShopItem(item.cost, item.name, isBg);
                    if (!success) alert('O taverneiro riu na sua cara. Ouro insuficiente para essa pechincha!');
                  }}
                  style={{
                    background: hero.gold >= item.cost ? '#e94560' : 'rgba(255,255,255,0.05)',
                    color: hero.gold >= item.cost ? '#fff' : '#666', 
                    border: 'none', padding: '8px 5px', borderRadius: '5px', 
                    cursor: hero.gold >= item.cost ? 'pointer' : 'not-allowed',
                    width:'100%', fontSize:'0.85rem', fontWeight:'600'
                  }}
                >
                  💳 Comprar (-{item.cost} G)
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', minHeight:'120px' }}>
        <h3 style={{ color: '#fff', marginBottom: '15px', fontFamily:'Orbitron', fontSize:'1rem' }}>🎒 Seus Pertences ({hero.inventory.length}/99)</h3>
        {hero.inventory.length === 0 ? <p style={{ color: '#666', fontSize:'0.9rem', fontStyle:'italic' }}>Sua mochila de viajante está tristonha e vazia...</p> : (
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {hero.inventory.map((inv, idx) => (
                  <span key={idx} style={{ background:'#333', padding:'5px 10px', borderRadius:'15px', fontSize:'0.8rem', border:'1px solid #555' }}>📦 {inv}</span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
