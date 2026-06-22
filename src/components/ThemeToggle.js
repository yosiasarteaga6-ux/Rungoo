import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ style = {} }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid var(--card-border)',
        color: 'var(--text-main)',
        padding: '10px 15px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        ...style
      }}
      className="theme-toggle-btn"
    >
      {theme === 'dark' ? <Sun size={18} color="#f1c40f" /> : <Moon size={18} color="#3b82f6" />}
      {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
    </button>
  );
}
