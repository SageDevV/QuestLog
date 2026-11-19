import { useStore } from '../store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function DashboardStats() {
  const quests = useStore(s => s.quests);

  const statsMap: Record<string, number> = {};
  quests.filter(q => q.completed && q.tag).forEach(q => {
    statsMap[q.tag!] = (statsMap[q.tag!] || 0) + 1;
  });

  const data = Object.keys(statsMap).map(key => ({
    subject: key,
    A: statsMap[key],
    fullMark: Math.max(...Object.values(statsMap)) + 2,
  }));

  if (data.length === 0) return <div className="empty-msg" style={{marginTop:'40px'}}>Nenhum dado analítico por aqui. Vá lá e complete suas missões setadas com categorias! 📊</div>;

  return (
    <div className="quest-card" style={{ padding: '20px', minHeight: '300px', margin: '20px 0', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#22e4ff', fontFamily: 'Orbitron', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mapa de Domínios Analíticos</h2>
      <div style={{ width: '100%', height: 300, background:'transparent' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="rgba(120,160,255,0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8892b0', fontSize:'0.75rem' }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fill:'none'}} axisLine={false}/>
            <Radar name="Herói" dataKey="A" stroke="#22e4ff" fill="#8b5cf6" fillOpacity={0.55} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p style={{textAlign:'center', color:'#8892b0', fontSize:'0.8rem', marginTop:'10px'}}>Este radar avalia qual "status da vida real" o seu Log está nutrindo ativamente.</p>
    </div>
  );
}
