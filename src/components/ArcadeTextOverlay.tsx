import { audioManager } from '../utils/audio';
import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../store';

export function ArcadeTextOverlay() {
  const [text, setText] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const gameStarted = useEditorStore((s) => s.gameStarted);

  useEffect(() => {
    const handleShowFault = (e: any) => {
      // Don't pop score text while sitting in the main menu
      if (!useEditorStore.getState().gameStarted) return;
      setText(e.detail);
      setKey(prev => prev + 1);
      
      if (e.detail !== 'FRAME HIT!') {
          const announceText = e.detail === 'POINT!' || e.detail === 'ACE!' ? 'Point' : (e.detail === 'SWEET SPOT!' || e.detail === 'FRAME HIT!' ? '' : e.detail.replace('!', '').toLowerCase());
          if (announceText) {
              audioManager.announce(announceText);
          }
      }
    };
    window.addEventListener('showFault', handleShowFault);
    return () => window.removeEventListener('showFault', handleShowFault);
  }, []);

  if (!text || !gameStarted) return null;

  let colorClass = "text-white";
  if (text.includes("OUT") || text.includes("FAULT")) colorClass = "text-red-400";
  if (text.includes("ACE") || text.includes("SWEET")) colorClass = "text-yellow-300";
  if (text.includes("POINT") || text.includes("DEUCE")) colorClass = "text-lime-300";

  return (
    <div key={key} className="absolute top-24 left-0 w-full flex items-start justify-center pointer-events-none z-[100]">
      <div className="animate-arcade-text text-center">
        <h1 className={`text-5xl md:text-7xl font-extrabold italic tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] ${colorClass}`}
            style={{ 
              WebkitTextStroke: '2px rgba(255, 255, 255, 0.4)', 
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' 
            }}>
          {text}
        </h1>
      </div>
    </div>
  );
}
