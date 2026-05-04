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
          <span className="login-logo-icon">⚔️</span>
          <h1 className="login-title">Bem-vindo de volta!</h1>
          <p className="login-subtitle">Sua guilda aguarda suas próximas ações.</p>
        </div>

        <button 
          className="google-login-btn" 
          onClick={handleStartClick} 
          style={{ 
            marginTop: '20px', 
            background: '#e94560', 
            color: 'white', 
            border: 'none',
            justifyContent: 'center',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}
        >
          ▶ INICIAR JORNADA
        </button>
      </div>
    </div>
  );
}
