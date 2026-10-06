import React, { useState, useRef } from 'react';

export const joystickState = {
  jump: false,
  x: 0,
  y: 0
};

export function Joystick() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number, clientY: number) => {
    if (!active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const maxDist = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setPos({ x: dx, y: dy });

    // Normalize for the game (-1 to 1)
    let nx = dx / maxDist;
    let ny = dy / maxDist;

    // Add a deadzone
    const distNorm = Math.sqrt(nx * nx + ny * ny);
    if (distNorm < 0.35) {
      nx = 0;
      ny = 0;
    }

    joystickState.x = nx;
    joystickState.y = ny;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setActive(true);
    containerRef.current?.setPointerCapture(e.pointerId);
    e.stopPropagation();
    handleMove(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (active) {
      e.stopPropagation();
      handleMove(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setActive(false);
    e.stopPropagation();
    containerRef.current?.releasePointerCapture(e.pointerId);
    setPos({ x: 0, y: 0 });
    joystickState.x = 0;
    joystickState.y = 0;
  };

  const dist = Math.min(1, Math.sqrt(pos.x * pos.x + pos.y * pos.y) / 50);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute bottom-6 left-5 w-36 h-36 md:w-40 md:h-40 rounded-full touch-none select-none font-hyper"
      style={{ zIndex: 1000 }}
    >
      {/* Outer chunky ring */}
      <div className="absolute inset-0 rounded-full bg-white/25 border-[6px] border-white/60 shadow-[0_8px_0_rgba(0,0,0,0.15),0_16px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm" />

      {/* Direction hints */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/80 text-xs font-extrabold drop-shadow">▲</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-xs font-extrabold drop-shadow">▼</div>
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/80 text-xs font-extrabold drop-shadow">◀</div>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 text-xs font-extrabold drop-shadow">▶</div>

      {/* Deadzone visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] h-[32%] rounded-full border-2 border-white/30 bg-white/5 pointer-events-none" />

      {/* Thumb */}
      <div
        className={`absolute top-1/2 left-1/2 w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full pointer-events-none flex items-center justify-center transition-shadow ${
          active
            ? 'bg-gradient-to-b from-yellow-200 to-amber-400 shadow-[0_4px_0_rgba(180,83,9,0.7),0_0_20px_rgba(255,220,60,0.6)]'
            : 'bg-gradient-to-b from-white to-slate-200 shadow-[0_5px_0_rgba(0,0,0,0.2)]'
        }`}
        style={{
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${active ? 1 + dist * 0.12 : 1})`,
          transition: active ? 'transform 0.03s linear' : 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span className={`text-2xl transition-transform ${active ? 'scale-110' : ''}`}>🎾</span>
      </div>
    </div>
  );
}
