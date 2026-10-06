import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../store';
import { audioManager } from '../utils/audio';
import { joystickState } from './Joystick';

/* ============================================================
   HYPERCASUAL HUD
   - ScoreBoard (top center)
   - ChargeGauge (shot power while holding swing)
   - ServePowerGauge (oscillating serve meter)
   - ActionButtons (mobile swing/jump + shot types)
   - TopBar (menu / sound / camera / settings)
   ============================================================ */

function getTennisScore(p: number, b: number, isTieBreak: boolean) {
  if (isTieBreak) return `${p}`;
  if (p >= 3 && b >= 3) {
    if (p === b) return '40';
    if (p > b) return 'AD';
    return '-';
  }
  const scores = ['0', '15', '30', '40'];
  return scores[p] || '40';
}

/* ---------------- ScoreBoard ---------------- */
export function ScoreBoard() {
  const {
    playerPoints, botPoints, playerGames, botGames, playerSets, botSets,
    isTieBreak, serverTurn,
  } = useEditorStore();
  const [flashKey, setFlashKey] = useState(0);
  const [flashSide, setFlashSide] = useState<'player' | 'bot'>('player');
  const prevPoints = useRef({ p: playerPoints, b: botPoints });

  useEffect(() => {
    if (playerPoints !== prevPoints.current.p) {
      setFlashSide('player');
      setFlashKey((k) => k + 1);
    } else if (botPoints !== prevPoints.current.b) {
      setFlashSide('bot');
      setFlashKey((k) => k + 1);
    }
    prevPoints.current = { p: playerPoints, b: botPoints };
  }, [playerPoints, botPoints]);

  const pDisplay = getTennisScore(playerPoints, botPoints, isTieBreak);
  const bDisplay = getTennisScore(botPoints, playerPoints, isTieBreak);

  const Side = ({ side }: { side: 'player' | 'bot' }) => {
    const isPlayer = side === 'player';
    const points = isPlayer ? pDisplay : bDisplay;
    const games = isPlayer ? playerGames : botGames;
    const sets = isPlayer ? playerSets : botSets;
    const serving = serverTurn === side;
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <div className={`text-[10px] font-extrabold tracking-wider ${isPlayer ? 'text-blue-600' : 'text-rose-500'}`}>
            {isPlayer ? 'YOU' : 'BOT'}
          </div>
          <div className="text-[9px] font-bold text-slate-400 leading-none">
            S{sets} G{games}
          </div>
        </div>
        <div
          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-extrabold ${
            isPlayer
              ? 'bg-gradient-to-b from-sky-400 to-blue-500 text-white shadow-[0_4px_0_#1e40af]'
              : 'bg-gradient-to-b from-rose-400 to-red-500 text-white shadow-[0_4px_0_#9f1239]'
          } ${flashSide === side ? 'animate-score-flash' : ''}`}
          key={flashSide === side ? flashKey : 'static'}
        >
          {points}
          {serving && (
            <div className="absolute -top-2 -right-2 text-sm drop-shadow" title="Serving">
              🎾
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pointer-events-none flex items-center gap-3 bg-white/95 rounded-full px-4 py-2 shadow-[0_6px_0_rgba(0,0,0,0.15),0_12px_24px_rgba(0,0,0,0.2)] font-hyper">
      <Side side="player" />
      <div className="text-slate-300 font-extrabold text-lg">×</div>
      <Side side="bot" />
    </div>
  );
}

/* ---------------- Charge Gauge (shot power) ---------------- */
const SHOT_LABELS: Record<string, string> = {
  topspin: 'TOPSPIN',
  slice: 'SLICE',
  lob: 'LOB',
  smash: 'SMASH!',
};

export function ChargeGauge() {
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const onUpdate = (e: any) => {
      setValue(e.detail);
      setVisible(true);
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
    const onEnd = () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 180);
    };
    window.addEventListener('updateCharge', onUpdate);
    window.addEventListener('endCharge', onEnd);
    return () => {
      window.removeEventListener('updateCharge', onUpdate);
      window.removeEventListener('endCharge', onEnd);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const shotType = (window as any).currentShotType || 'topspin';
  const isMax = value >= 0.98;
  const segments = 12;
  const filled = Math.round(value * segments);

  const colorFor = (i: number) => {
    const t = i / segments;
    if (t < 0.4) return 'bg-emerald-400';
    if (t < 0.75) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-44 md:bottom-28 z-30 flex flex-col items-center transition-all duration-200 font-hyper ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
    >
      <div
        className={`mb-1.5 px-4 py-0.5 rounded-full text-sm font-extrabold tracking-widest text-white ${
          isMax ? 'bg-red-500 animate-hc-pulse' : 'bg-black/45'
        }`}
      >
        {isMax ? 'PERFECT! 🔥' : SHOT_LABELS[shotType] || 'POWER'}
      </div>
      <div className="flex gap-1.5 p-2 bg-black/45 rounded-2xl border-2 border-white/25 backdrop-blur-sm shadow-xl">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-7 md:w-5 md:h-8 rounded-md transition-all duration-75 ${
              i < filled ? `${colorFor(i)} shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]` : 'bg-white/15'
            } ${isMax && i < filled ? 'animate-charge-max' : ''}`}
            style={{ animationDelay: `${i * 0.03}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Serve Power Gauge ---------------- */
export function ServePowerGauge() {
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onShow = () => setVisible(true);
    const onHide = () => setVisible(false);
    const onUpdate = (e: any) => setValue(e.detail);
    window.addEventListener('showServePower', onShow);
    window.addEventListener('hideServePower', onHide);
    window.addEventListener('updateServePower', onUpdate);
    return () => {
      window.removeEventListener('showServePower', onShow);
      window.removeEventListener('hideServePower', onHide);
      window.removeEventListener('updateServePower', onUpdate);
    };
  }, []);

  const zone = value < 0.4 ? 'FAULT' : value > 0.85 ? 'ACE!' : 'OK';
  const zoneColor = value < 0.4 ? 'text-red-400' : value > 0.85 ? 'text-emerald-300' : 'text-yellow-300';

  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-44 md:bottom-28 z-30 flex flex-col items-center transition-all duration-200 font-hyper ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
    >
      <div className="text-white font-extrabold text-lg tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] mb-1.5">
        SERVE POWER <span className={zoneColor}>[{zone}]</span>
      </div>
      <div className="w-72 h-8 bg-black/50 rounded-full border-[3px] border-white/40 overflow-hidden relative shadow-xl backdrop-blur-sm">
        <div className="absolute top-0 bottom-0 left-0 w-[40%] bg-red-500/40" />
        <div className="absolute top-0 bottom-0 left-[40%] w-[45%] bg-yellow-500/40" />
        <div className="absolute top-0 bottom-0 left-[85%] right-0 bg-emerald-500/50" />
        <div className="absolute top-0 bottom-0 left-[85%] w-[3px] bg-white z-10 shadow-[0_0_8px_white]" />
        <div
          className="h-full bg-gradient-to-r from-yellow-200 to-white shadow-[0_0_12px_rgba(255,255,255,0.8)] rounded-r-full relative z-20 transition-none"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- Mobile / Universal Action Buttons ---------------- */
function pressKey(key: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

const SHOT_BUTTONS = [
  { key: 'j', label: 'TOP', sub: 'spin', color: 'from-blue-400 to-blue-600', shadow: '#1e40af' },
  { key: 'k', label: 'SLC', sub: 'low', color: 'from-cyan-400 to-teal-500', shadow: '#0f766e' },
  { key: 'l', label: 'LOB', sub: 'high', color: 'from-violet-400 to-purple-600', shadow: '#5b21b6' },
  { key: 'm', label: 'SMASH', sub: 'slow-mo', color: 'from-amber-400 to-orange-600', shadow: '#b45309' },
];

export function ActionButtons() {
  const [heldKey, setHeldKey] = useState<string | null>(null);

  const startShot = (key: string) => {
    if (heldKey) return;
    setHeldKey(key);
    pressKey(key, 'keydown');
  };
  const releaseShot = () => {
    if (heldKey) {
      pressKey(heldKey, 'keyup');
      setHeldKey(null);
    }
  };

  useEffect(() => {
    // Safety: release if pointer leaves window while held
    const onUp = () => releaseShot();
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      releaseShot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldKey]);

  return (
    <div className="absolute bottom-6 right-5 z-[1000] flex flex-col items-center gap-3 font-hyper select-none">
      {/* Shot type selectors */}
      <div className="flex gap-2">
        {SHOT_BUTTONS.map((b) => (
          <button
            key={b.key}
            onPointerDown={(e) => {
              e.stopPropagation();
              startShot(b.key);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              releaseShot();
            }}
            onPointerCancel={releaseShot}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-b ${b.color} hc-btn flex flex-col items-center justify-center ${
              heldKey === b.key ? 'pressed animate-ready-glow' : ''
            }`}
            style={{ boxShadow: `0 5px 0 ${b.shadow}, 0 10px 18px rgba(0,0,0,0.25)` }}
          >
            <span className="text-white font-extrabold text-xs leading-none drop-shadow">{b.label}</span>
            <span className="text-white/80 text-[8px] font-bold">{b.sub}</span>
          </button>
        ))}
      </div>

      {/* Jump */}
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          joystickPressJump();
        }}
        className="relative w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full bg-gradient-to-b from-emerald-300 to-green-500 hc-btn flex flex-col items-center justify-center"
        style={{ boxShadow: '0 6px 0 #166534, 0 12px 22px rgba(0,0,0,0.25)' }}
      >
        <span className="text-2xl leading-none">🏃‍♂️</span>
        <span className="text-white font-extrabold text-[10px] mt-0.5">JUMP</span>
      </button>

      {/* Big SWING (hold to charge) */}
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          startShot('j');
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          releaseShot();
        }}
        onPointerCancel={releaseShot}
        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hc-btn flex flex-col items-center justify-center ${
          heldKey === 'j' ? 'pressed animate-ready-glow' : ''
        }`}
        style={{ boxShadow: '0 7px 0 #b45309, 0 16px 28px rgba(0,0,0,0.3)' }}
      >
        <span className="text-4xl">🎾</span>
        <span className="text-white font-extrabold text-sm tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">
          SWING!
        </span>
      </button>
    </div>
  );
}

function joystickPressJump() {
  joystickState.jump = true;
}

/* ---------------- Top Bar ---------------- */
export function TopBar({
  onExitToMenu,
  sfxOn,
  onToggleSfx,
  musicOn,
  onToggleMusic,
  onOpenAdvanced,
  tennisCamera,
  onTennisCamera,
}: {
  onExitToMenu: () => void;
  sfxOn: boolean;
  onToggleSfx: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  onOpenAdvanced: () => void;
  tennisCamera: 'broadcast' | 'gta';
  onTennisCamera: (c: 'broadcast' | 'gta') => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const courtTheme = useEditorStore((s) => s.courtTheme);
  const ballColor = useEditorStore((s) => s.ballColor);
  const isAutoPlay = useEditorStore((s) => s.isAutoPlay);
  const setIsAutoPlay = useEditorStore((s) => s.setIsAutoPlay);
  const courtLength = useEditorStore((s) => s.courtLength);
  const setCourtLength = useEditorStore((s) => s.setCourtLength);

  const cycleCourt = () => {
    const store = useEditorStore.getState();
    const next = store.courtTheme === 'grass' ? 'hard' : store.courtTheme === 'hard' ? 'clay' : 'grass';
    store.setCourtTheme(next);
  };
  const cycleBall = () => {
    const store = useEditorStore.getState();
    const colors = ['yellow', 'cyan', 'purple', 'orange', 'rainbow'] as const;
    const idx = colors.indexOf(store.ballColor);
    store.setBallColor(colors[(idx + 1) % colors.length]);
  };

  const CircleBtn = ({
    onClick, children, title, active = false,
  }: { onClick: () => void; children: React.ReactNode; title: string; active?: boolean }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl hc-btn ${
        active ? 'bg-yellow-300' : 'bg-white/95'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      {/* Left cluster */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2.5 font-hyper">
        <CircleBtn onClick={onExitToMenu} title="Kembali ke menu">
          🏠
        </CircleBtn>
      </div>

      {/* Right cluster */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2.5 font-hyper">
        <CircleBtn onClick={onToggleSfx} title="Sound effects">
          {sfxOn ? '🔊' : '🔇'}
        </CircleBtn>
        <CircleBtn onClick={onToggleMusic} title="Music" active={musicOn}>
          🎵
        </CircleBtn>
        <CircleBtn
          onClick={() => onTennisCamera(tennisCamera === 'gta' ? 'broadcast' : 'gta')}
          title="Camera angle"
        >
          🎥
        </CircleBtn>
        <CircleBtn onClick={() => setSettingsOpen((s) => !s)} title="Settings" active={settingsOpen}>
          ⚙️
        </CircleBtn>
      </div>

      {/* Settings popover */}
      {settingsOpen && (
        <div className="absolute top-20 right-4 z-[1100] w-72 bg-white/95 backdrop-blur rounded-3xl p-4 shadow-[0_8px_0_rgba(0,0,0,0.15),0_20px_40px_rgba(0,0,0,0.3)] font-hyper animate-hc-pop-in">
          <div className="text-slate-800 font-extrabold text-lg mb-3 text-center tracking-wide">
            ⚙️ SETTINGS
          </div>

          <button
            onClick={cycleCourt}
            className="w-full flex items-center justify-between bg-emerald-100 hover:bg-emerald-200 rounded-2xl px-4 py-2.5 mb-2 transition-colors"
          >
            <span className="font-extrabold text-emerald-800 text-sm">🏓 Court</span>
            <span className="font-extrabold text-emerald-600 text-sm uppercase">{courtTheme}</span>
          </button>
          <button
            onClick={cycleBall}
            className="w-full flex items-center justify-between bg-yellow-100 hover:bg-yellow-200 rounded-2xl px-4 py-2.5 mb-2 transition-colors"
          >
            <span className="font-extrabold text-yellow-800 text-sm">🎾 Bola</span>
            <span className="font-extrabold text-yellow-600 text-sm uppercase">{ballColor}</span>
          </button>
          <div className="bg-sky-100 rounded-2xl px-4 py-2.5 mb-2">
            <div className="flex justify-between mb-1">
              <span className="font-extrabold text-sky-800 text-sm">📏 Panjang lapangan</span>
              <span className="font-extrabold text-sky-600 text-sm">{courtLength.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="12"
              max="30"
              step="0.5"
              value={courtLength}
              onChange={(e) => setCourtLength(parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>

          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`w-full flex items-center justify-between rounded-2xl px-4 py-2.5 mb-2 transition-colors ${
              isAutoPlay ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-100 hover:bg-purple-200'
            }`}
          >
            <span className={`font-extrabold text-sm ${isAutoPlay ? 'text-white' : 'text-purple-800'}`}>
              🤖 Auto Play
            </span>
            <span
              className={`w-12 h-6 rounded-full relative transition-colors ${
                isAutoPlay ? 'bg-white/40' : 'bg-purple-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  isAutoPlay ? 'left-6' : 'left-0.5'
                }`}
              />
            </span>
          </button>

          <button
            onClick={() => {
              setSettingsOpen(false);
              onOpenAdvanced();
            }}
            className="w-full bg-slate-200 hover:bg-slate-300 rounded-2xl px-4 py-2.5 font-extrabold text-slate-600 text-sm"
          >
            🛠️ Advanced Editor
          </button>

          <div className="mt-3 text-center text-[10px] font-bold text-slate-400 leading-relaxed">
            H — editor tersembunyi • B — warna bola • G — skin • V — mute
          </div>
        </div>
      )}
    </>
  );
}
