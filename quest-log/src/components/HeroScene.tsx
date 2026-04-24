import { useState, useEffect } from 'react';
import runnerGif from '../runner.gif';
import CyberpunkCity from './CyberpunkCity';


function getTimeOfDay(): 'morning' | 'afternoon' | 'night' {
  // Allow URL override for testing: ?time=morning|afternoon|night
  const params = new URLSearchParams(window.location.search);
  const override = params.get('time');
  if (override === 'morning' || override === 'afternoon' || override === 'night') return override;

  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

export default function HeroScene() {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const [isRaining, setIsRaining] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    // Open-Meteo Integration via Geolocation Context
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`);
          const data = await res.json();
          // WMO Weather codes 51-99 indicates Rain, Showers, and Thunderstorms
          if (data && data.current_weather && data.current_weather.weathercode >= 51 && isMounted) {
            setIsRaining(true);
          }
        } catch { /* Suppress net err if offline */ }
      }, () => {
         // Silently failed geolocating. Just default to no rain.
      });
    }
    return () => { isMounted = false; };
  }, []);

  return (
    <div className={`hero-scene-bg ${isRaining ? 'is-raining' : ''}`} aria-hidden="true">
      <div className={`scene-sky scene-sky--${timeOfDay}`} />

      {timeOfDay === 'afternoon' && !isRaining && (
        <div className="scene-clouds">
          <span className="cloud cloud-1" />
          <span className="cloud cloud-2" />
          <span className="cloud cloud-3" />
        </div>
      )}
      
      {isRaining && (
        <div className="scene-rain-overlay" style={{position:'absolute', inset:0, background:'rgba(5, 10, 20, 0.5)', zIndex:2}} />
      )}

      {/* ── Cyberpunk city — horizon (blurred silhouettes) ── */}
      <div className="scene-city-horizon" style={{filter: isRaining ? 'brightness(0.4)' : 'none'}}>
        <CyberpunkCity timeOfDay={timeOfDay} layer="horizon" />
        <CyberpunkCity timeOfDay={timeOfDay} layer="horizon" />
      </div>

      {/* ── Cyberpunk city skyline (far) ── */}
      <div className="scene-city-far" style={{filter: isRaining ? 'brightness(0.5)' : 'none'}}>
        <CyberpunkCity timeOfDay={timeOfDay} layer="far" />
        <CyberpunkCity timeOfDay={timeOfDay} layer="far" />
      </div>

      {/* ── Cyberpunk city skyline (near / bigger) ── */}
      <div className="scene-city-near" style={{filter: isRaining ? 'brightness(0.6)' : 'none'}}>
        <CyberpunkCity timeOfDay={timeOfDay} layer="near" />
        <CyberpunkCity timeOfDay={timeOfDay} layer="near" />
      </div>

      <div className="scene-grass" style={{filter: isRaining ? 'brightness(0.8)' : 'none'}}/>
      <div className="scene-grass-front" />

      {isRaining && <div className="rain-generator" />}

      <div className="scene-hero-container">
        <img src={runnerGif} alt="" className="scene-hero-sprite" />
      </div>



      <div className={`scene-particles scene-particles--${timeOfDay}`} style={{opacity: isRaining ? 0.2 : 1}}>
        {[...Array(12)].map((_, i) => <span key={i} className={`particle p${i+1}`} />)}
      </div>

      {isRaining && (
        <style>{`
          .rain-generator {
            position: absolute;
            top: -100%; left: 0; width: 100%; height: 200%;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="100"><rect width="1" height="15" fill="rgba(200,220,255,0.4)"/></svg>') repeat;
            animation: rain-drop 0.8s linear infinite;
            z-index: 4;
            transform: rotate(5deg);
          }
          @keyframes rain-drop {
            0% { transform: translateY(0) rotate(5deg); }
            100% { transform: translateY(50%) rotate(5deg); }
          }
        `}</style>
      )}
    </div>
  );
}
