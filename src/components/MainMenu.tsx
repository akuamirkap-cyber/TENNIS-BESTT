import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { audioManager } from '../utils/audio';

interface MainMenuProps {
  onPlay: () => void;
}

const CHARACTERS = [
  { id: 'default' as const, label: 'PRO', emoji: '🧑‍🦱' },
  { id: 'mouse' as const, label: 'MOUSE', emoji: '🐭' },
  { id: 'mumu' as const, label: 'MUMU', emoji: '🐼' },
];

function FloatingBall({ className, delay, size }: { className: string; delay: string; size: number }) {
  return (
    <div
      className={`absolute animate-hc-float pointer-events-none ${className}`}
      style={{ animationDelay: delay, width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-yellow-300 shadow-[inset_-8px_-8px_0_rgba(0,0,0,0.12)] border-4 border-white/70 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[3px] bg-white/90 rotate-45 absolute" />
          <div className="w-full h-[3px] bg-white/90 -rotate-45 absolute" />
        </div>
      </div>
    </div>
  );
}

function FloatingDeco({ className, delay, size, emoji }: { className: string; delay: string; size: number; emoji: string }) {
  return (
    <div
      className={`absolute animate-hc-float pointer-events-none select-none ${className}`}
      style={{ animationDelay: delay, fontSize: size }}
    >
      {emoji}
    </div>
  );
}

export function MainMenu({ onPlay }: MainMenuProps) {
  const [exiting, setExiting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const skinType = useEditorStore((s) => s.skinType);
  const setSkinType = useEditorStore((s) => s.setSkinType);
  const playerSets = useEditorStore((s) => s.playerSets);
  const botSets = useEditorStore((s) => s.botSets);
  const hasRecord = playerSets + botSets > 0;

  const handlePlay = () => {
    if (exiting) return;
    setExiting(true);
    if (soundOn) {
      audioManager.setMuted(false);
      audioManager.playWoosh();
    }
    setTimeout(() => onPlay(), 450);
  };

  return (
    <div
      className={`absolute inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden font-hyper ${
        exiting ? 'menu-exit' : ''
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/90 via-cyan-400/80 to-emerald-400/85" />
      <div className="absolute inset-0 backdrop-blur-[3px]" />

      {/* Decorative floating balls & stars */}
      <FloatingBall className="top-[12%] left-[8%]" delay="0s" size={72} />
      <FloatingBall className="top-[18%] right-[10%]" delay="1.2s" size={54} />
      <FloatingBall className="bottom-[15%] left-[14%]" delay="2.1s" size={44} />
      <FloatingBall className="bottom-[22%] right-[16%]" delay="0.7s" size={64} />
      <FloatingDeco className="top-[30%] left-[18%]" delay="0.9s" size={40} emoji="⭐" />
      <FloatingDeco className="top-[42%] right-[14%]" delay="1.7s" size={34} emoji="✨" />
      <FloatingDeco className="bottom-[30%] left-[24%]" delay="2.6s" size={30} emoji="⭐" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10" />

      {/* Sound toggle */}
      <button
        onClick={() => {
          setSoundOn((s) => {
            audioManager.setMuted(!s ? false : true);
            return !s;
          });
        }}
        className="absolute top-5 right-5 z-10 w-12 h-12 rounded-full bg-white/90 hc-btn active:translate-y-1 flex items-center justify-center text-2xl"
        title="Sound"
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {/* ===== Title ===== */}
      <div className="relative z-10 flex flex-col items-center animate-hc-pop-in">
        <div className="relative">
          <h1
            className="text-6xl md:text-8xl font-extrabold tracking-tight text-white text-center leading-none"
            style={{
              textShadow:
                '0 4px 0 #0e9f6e, 0 8px 0 rgba(0,0,0,0.25), 0 16px 30px rgba(0,0,0,0.35)',
              WebkitTextStroke: '2px rgba(255,255,255,0.35)',
            }}
          >
            TENNIS
          </h1>
          <div className="absolute -right-8 -top-6 md:-right-14 md:-top-9 text-5xl md:text-7xl animate-hc-spin-slow drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]">
            🎾
          </div>
        </div>
        <div className="mt-2 px-5 py-1.5 rounded-full bg-white/90 shadow-[0_4px_0_rgba(0,0,0,0.15)] -rotate-2">
          <span className="text-lg md:text-2xl font-extrabold text-emerald-600 tracking-widest">
            BESTT SMASH
          </span>
        </div>
        <div className="mt-3 text-white/95 text-sm md:text-base font-bold bg-black/25 rounded-full px-4 py-1 animate-hc-bounce">
          🏆 Kalahkan sang Bot jago!
        </div>
      </div>

      {/* ===== Character select ===== */}
      <div className="relative z-10 mt-8 animate-hc-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-3 bg-white/40 rounded-full px-4 py-2 backdrop-blur-sm">
          <span className="text-xs font-extrabold text-white tracking-widest drop-shadow">CHARACTER</span>
          {CHARACTERS.map((c) => {
            const active = skinType === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSkinType(c.id)}
                className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                  active
                    ? 'bg-white scale-110 shadow-[0_4px_0_rgba(0,0,0,0.2)] ring-2 ring-emerald-400'
                    : 'bg-white/50 hover:bg-white/80 shadow-[0_3px_0_rgba(0,0,0,0.1)]'
                }`}
                title={c.label}
              >
                <span className="text-xl leading-none">{c.emoji}</span>
                <span className="text-[8px] font-extrabold text-slate-600 mt-0.5">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== PLAY ===== */}
      <button
        onClick={handlePlay}
        className="relative z-10 mt-9 px-16 md:px-20 py-4 md:py-5 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hc-btn animate-hc-bounce overflow-hidden"
        style={{ animationDelay: '0.22s' }}
      >
        <span className="relative z-10 text-3xl md:text-4xl font-extrabold text-white tracking-widest drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
          PLAY!
        </span>
        {/* shine sweep */}
        <span className="absolute top-0 bottom-0 w-16 bg-white/40 blur-md animate-hc-shine" />
      </button>

      {/* Controls hint */}
      <div
        className="relative z-10 mt-7 flex flex-wrap justify-center gap-x-4 gap-y-1 text-white/95 text-xs md:text-sm font-bold px-6 animate-hc-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        <span className="bg-black/25 rounded-full px-3 py-1">🕹️ WASD / Joystick — Gerak</span>
        <span className="bg-black/25 rounded-full px-3 py-1">⌨️ J K L M — Pukulan</span>
        <span className="bg-black/25 rounded-full px-3 py-1"> SPACE — Lompat / Toss</span>
      </div>

      {hasRecord && (
        <div className="relative z-10 mt-3 text-white/90 text-sm font-extrabold bg-black/25 px-4 py-1.5 rounded-full">
          Set terakhir: KAMU {playerSets} — {botSets} BOT
        </div>
      )}

      <div className="absolute bottom-3 w-full text-center text-white/70 text-xs font-bold tracking-widest">
        v1.1 • HYPERCASUAL TENNIS
      </div>
    </div>
  );
}
