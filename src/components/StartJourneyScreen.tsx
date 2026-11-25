import HudIcon from './HudIcon';
import { unlockWarningAudio } from './WarningScreen';

export default function StartJourneyScreen({ onStart }: { onStart: () => void }) {
  const handleStartClick = () => {
    unlockWarningAudio();
    onStart();
  };

  return (
    <div className="login-screen">
      <div className="login-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="login-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon"><HudIcon name="crest" /></span>
          <h1 className="login-title">Bem-vindo de volta!</h1>
          <p className="login-subtitle">Sua guilda aguarda suas próximas ações.</p>
        </div>

        <button 
          className="google-login-btn" 
          onClick={handleStartClick} 
          style={{ 
            marginTop: '20px', 
            background: 'linear-gradient(135deg, #22e4ff, #8b5cf6 55%, #ff3d81)', 
            color: '#05070f', 
            border: 'none',
            justifyContent: 'center',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}
        >
          <HudIcon name="play" /> INICIAR JORNADA
        </button>
      </div>
    </div>
  );
}
