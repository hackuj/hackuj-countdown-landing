"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
  title?: string;
  subtitle?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function CountdownTimer({
  targetDate,
  title = "SPUSTENIE SEZÓNY O",
  subtitle = "Registrácia je otvorená. Zadaj email a získaš okamžitú notifikáciu pri štarte súťaže.",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  const formatNum = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="countdown-container">
      <div className="countdown-badge">
        <span className="countdown-pulse-dot" />
        <span className="countdown-badge-text">ŽIVÝ ODPOČET / SEASON '26</span>
      </div>

      <h2 className="countdown-title">{title}</h2>
      <p className="countdown-subtitle">{subtitle}</p>

      {timeLeft.isExpired ? (
        <div className="countdown-expired-box">
          <span className="countdown-expired-badge">SÚŤAŽ JE SPUSTENÁ!</span>
          <p>Sezóna 2026 práve začala. Zapoj sa do prvej výzvy ešte dnes.</p>
        </div>
      ) : (
        <div className="countdown-clock-grid">
          <div className="countdown-clock-card">
            <span className="countdown-num">{formatNum(timeLeft.days)}</span>
            <span className="countdown-label">DNI</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-clock-card">
            <span className="countdown-num">{formatNum(timeLeft.hours)}</span>
            <span className="countdown-label">HODINY</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-clock-card">
            <span className="countdown-num">{formatNum(timeLeft.minutes)}</span>
            <span className="countdown-label">MINÚTY</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-clock-card countdown-clock-card--highlight">
            <span className="countdown-num">{formatNum(timeLeft.seconds)}</span>
            <span className="countdown-label">SEKUNDY</span>
          </div>
        </div>
      )}

      {/* Pre-registration / notification form */}
      <div className="countdown-notify-box">
        {subscribed ? (
          <div className="countdown-success-msg">
            <span className="countdown-success-icon">✓</span>
            <div>
              <strong>Si v poradovníku!</strong>
              <p>Dáme ti vedieť hneď v sekunde, keď sa prvé súťažné serverové uzly otvoria.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="countdown-form">
            <div className="countdown-input-wrap">
              <input
                type="email"
                placeholder="Tvoj študentský alebo osobný email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="countdown-input"
              />
              <button type="submit" className="btn-target-primary countdown-submit-btn">
                Upozorniť ma pri štarte <span aria-hidden="true">→</span>
              </button>
            </div>
            <span className="countdown-form-note">
              * Odoslaním získaš predbežnú registráciu + early-bird bonus +50 XP pri štarte.
            </span>
          </form>
        )}
      </div>
    </div>
  );
}
