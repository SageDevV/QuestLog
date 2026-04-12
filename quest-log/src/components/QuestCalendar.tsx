import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG } from '../types';
import { getDaysInMonth, getFirstDayOfWeek, formatMonthYear, groupQuestsByDay } from '../calendarUtils';

interface QuestCalendarProps {
  quests: Quest[];
  onComplete: (id: string) => void;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function QuestCalendar({ quests, onComplete }: QuestCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const questsByDay = groupQuestsByDay(quests, currentYear, currentMonth);

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(null);
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(null);
  }

  function handleDayClick(day: number) {
    setSelectedDay(prev => (prev === day ? null : day));
  }

  const selectedQuests = selectedDay ? questsByDay.get(selectedDay) ?? [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="quest-calendar">
      <div className="calendar-header">
        <button onClick={goToPrevMonth} aria-label="Mês anterior">◀</button>
        <h2>{formatMonthYear(currentYear, currentMonth)}</h2>
        <button onClick={goToNextMonth} aria-label="Próximo mês">▶</button>
      </div>

      <div className="calendar-grid">
        {DAY_LABELS.map(label => (
          <div key={label} className="calendar-day-label">{label}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="calendar-day empty" />;
          const dayQuests = questsByDay.get(day);
          const hasQuests = !!dayQuests && dayQuests.length > 0;
          const isSelected = selectedDay === day;
          return (
            <div
              key={day}
              className={`calendar-day${hasQuests ? ' has-quests' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span>{day}</span>
              {hasQuests && <span className="quest-indicator">{dayQuests.length}</span>}
            </div>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="day-panel">
          <h3>Dia {selectedDay}</h3>
          {selectedQuests.length === 0 ? (
            <p className="empty-msg">Nenhuma missão neste dia</p>
          ) : (
            selectedQuests.map(quest => {
              const cfg = DIFFICULTY_CONFIG[quest.difficulty];
              return (
                <div key={quest.id} className="day-panel-quest">
                  <span className="day-panel-quest-status">{quest.completed ? '✅' : '📋'}</span>
                  <span className="day-panel-quest-title">{quest.title}</span>
                  <span className="day-panel-quest-difficulty">{cfg.emoji} {cfg.label}</span>
                  <span className="day-panel-quest-reward">+{cfg.xp}XP +{cfg.gold}⚡</span>
                  {!quest.completed && (
                    <button
                      className="complete-btn"
                      onClick={(e) => { e.stopPropagation(); onComplete(quest.id); }}
                    >
                      ✅ Completar
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
