import React, { useState, useEffect } from 'react';

const Clock = () => {
    const [time, setTime] = useState(new Date());
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };

    const timeStr = time.toLocaleTimeString([], timeOptions);
    const dateStr = time.toLocaleDateString('es-ES', dateOptions);

    return (
        <>
            {/* ── Versión COMPLETA — visible en desktop (≥ 769px) ── */}
            <div className="clock-full">
                <div className="clock-time">{timeStr}</div>
                <div className="clock-date">{dateStr}</div>
            </div>

            {/* ── Versión COMPACTA — visible en mobile (≤ 768px) ── */}
            <button
                className={`clock-mini${expanded ? ' clock-mini--expanded' : ''}`}
                onClick={() => setExpanded(prev => !prev)}
                title="Ver fecha completa"
                type="button"
            >
                <span className="clock-mini-icon">🕐</span>
                <span className="clock-mini-time">{timeStr}</span>
                {expanded && (
                    <span className="clock-mini-date">{dateStr}</span>
                )}
            </button>
        </>
    );
};

export default Clock;
