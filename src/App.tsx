import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TennisCharacter } from './components/TennisCharacter';
import { TennisBall } from './components/TennisBall';
import { HitParticles } from "./components/Effects";
import { AnimationEditor } from './components/AnimationEditor';
import { Joystick } from './components/Joystick';
import { TennisCourt } from './components/TennisCourt';
import { Referee } from './components/Referee';
import { CameraEditor } from './components/CameraEditor';
import { CharacterSizeEditor } from './components/CharacterSizeEditor';
import { PhysicsEditor } from './components/PhysicsEditor';
import { ArcadeTextOverlay } from './components/ArcadeTextOverlay';
import { CameraSetupModal } from './components/CameraSetupModal';
import { MainMenu } from './components/MainMenu';
import { ScoreBoard, ChargeGauge, ServePowerGauge, ActionButtons, TopBar } from './components/HUD';
import { audioManager } from './utils/audio';
import { useEditorStore } from './store';

const dummyCube = Array(6).fill("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

const EnvTextureWrapper = ({ themeConfig, useEnvGround, envRadius, envHeight, envScale, envPosX, envPosY, envPosZ, envRotY }: any) => {
  const texture = useTexture(themeConfig.files) as THREE.Texture;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[envPosX, envPosY, envPosZ]} rotation={[0, envRotY, 0]}>
      <Environment 
        map={texture} 
        files={useEnvGround ? dummyCube : undefined}
        background 
        environmentIntensity={1.0} 
        resolution={2048} 
        ground={useEnvGround ? { radius: envRadius, height: envHeight, scale: envScale } : undefined}
      />
    </group>
  );
};

const DynamicEnvironment = ({ themeConfig, useEnvGround, envRadius, envHeight, envScale, envPosX, envPosY, envPosZ, envRotY }: any) => {
  const isHdr = themeConfig.files.endsWith('.hdr') || themeConfig.files.endsWith('.exr');
  if (isHdr) {
    return (
      <group position={[envPosX, envPosY, envPosZ]} rotation={[0, envRotY, 0]}>
        <Environment 
          files={themeConfig.files} 
          background 
          environmentIntensity={1.0} 
          resolution={2048} 
          ground={useEnvGround ? { radius: envRadius, height: envHeight, scale: envScale } : undefined}
        />
      </group>
    );
  } else {
    return (
      <EnvTextureWrapper 
        themeConfig={themeConfig} 
        useEnvGround={useEnvGround} 
        envRadius={envRadius} 
        envHeight={envHeight} 
        envScale={envScale} 
        envPosX={envPosX}
        envPosY={envPosY}
        envPosZ={envPosZ}
        envRotY={envRotY}
      />
    );
  }
};

function CameraController({ mode, characterRef, settings, gameMode, stumbleCamera, tennisCamera, camConfig }: { mode: 'orbit' | 'game', characterRef: React.RefObject<THREE.Group | null>, settings: any, gameMode: string, stumbleCamera?: string, tennisCamera?: string, camConfig?: any }) {
  const { camera } = useThree();
  const cameraShake = useEditorStore((state) => state.cameraShake);
  const setCameraShake = useEditorStore((state) => state.setCameraShake);
  const seedRef = useRef(Math.random());
  const smoothedForwardRef = useRef(new THREE.Vector3(0, 0, -1));
  
  useFrame((state, delta) => {
    // Restore base camera pos before lerp if it was shaken in the previous frame
    if (state.scene.userData.baseCamPos && cameraShake > 0) {
       camera.position.copy(state.scene.userData.baseCamPos);
    }

    // Auto recover timeScale for smooth freeze effect
    const unscaledDelta = Math.min(0.05, 1.0 / 30.0);
    const timeScale = useEditorStore.getState().timeScale;
    if (timeScale < 1.0) {
       const nextTimeScale = Math.min(1.0, timeScale + unscaledDelta * 2.5);
       useEditorStore.getState().setTimeScale(nextTimeScale);
    }

    if (cameraShake > 0) {
      setCameraShake(Math.max(0, cameraShake - delta * 4.0));
    }

    if (mode === 'game') {
      let targetPos = new THREE.Vector3(settings.posX, settings.posY, settings.posZ);
      let lookAtPos = new THREE.Vector3(settings.lookX, settings.lookY, settings.lookZ);
      
      let isGtaCam = (gameMode === 'stumble' && stumbleCamera === 'gta') || (gameMode === 'tennis' && tennisCamera === 'gta');
      
      if (characterRef.current) {
        const charPos = new THREE.Vector3();
        characterRef.current.getWorldPosition(charPos);
        
                                        if (isGtaCam) {
            if (gameMode === 'tennis') {
                targetPos.set(charPos.x, charPos.y + (camConfig?.tennisGtaTargetY || 2.0), charPos.z + (camConfig?.tennisGtaTargetZ || 3.5));
                lookAtPos.set(charPos.x, charPos.y + (camConfig?.tennisGtaLookY || 1.0), charPos.z + (camConfig?.tennisGtaLookZ || -10));
            } else {
                // Character natively faces +Z
                const charForward = new THREE.Vector3(0, 0, 1).applyQuaternion(characterRef.current.quaternion);
                charForward.y = 0;
                charForward.normalize();
                
                if (smoothedForwardRef.current.dot(charForward) < -0.99) {
                    smoothedForwardRef.current.add(new THREE.Vector3(0.01, 0, 0.01)).normalize();
                }
                
                smoothedForwardRef.current.lerp(charForward, 10.0 * delta).normalize();
                
                const forward = smoothedForwardRef.current;
                
                const distance = camConfig?.stumbleGtaDistance || 3.0;
                const height = camConfig?.stumbleGtaHeight || 2.0;
                
                targetPos.copy(charPos).addScaledVector(forward, -distance);
                targetPos.y += height;
                
                const lookDist = camConfig?.stumbleGtaLookDist || 5.5;
                lookAtPos.copy(charPos).addScaledVector(forward, lookDist);
                lookAtPos.y += (camConfig?.stumbleGtaLookY || -0.5);
            }
        } else {
            if (gameMode === 'stumble') {
                targetPos.set(0, camConfig?.stumbleDefaultTargetY || 12, camConfig?.stumbleDefaultTargetZ || 16);
                lookAtPos.set(0, camConfig?.stumbleDefaultLookY || 0, camConfig?.stumbleDefaultLookZ || -5);
            }
            targetPos.x += charPos.x;
            targetPos.z += charPos.z;
            lookAtPos.x += charPos.x;
            lookAtPos.z += charPos.z;
        }
      }
      
      const lerpFactorPos = 1.0 - Math.pow(0.001, delta);
      if (isGtaCam && gameMode === 'stumble') {
         camera.position.lerp(targetPos, 1.0 - Math.exp(-25.0 * delta));
      } else {
         camera.position.lerp(targetPos, lerpFactorPos);
      }
      
      const currentQuat = camera.quaternion.clone();
      camera.lookAt(lookAtPos);
      const targetQuat = camera.quaternion.clone();
      camera.quaternion.copy(currentQuat);
      
      const lerpFactorRot = 1.0 - Math.pow(0.00001, delta);
      if (isGtaCam && gameMode === 'stumble') {
          camera.quaternion.slerp(targetQuat, 1.0 - Math.exp(-20.0 * delta));
      } else {
          camera.quaternion.slerp(targetQuat, lerpFactorRot);
      }
      
      if (cameraShake > 0) {
        const shakeMag = cameraShake * 0.2;
        const t = performance.now() * 0.03 + seedRef.current * 100.0;
        
        const shakeX = (Math.sin(t) + Math.sin(t * 1.5)) * shakeMag;
        const shakeY = (Math.cos(t * 1.2) + Math.cos(t * 2.1)) * shakeMag;
        const shakeZ = (Math.sin(t * 0.8) + Math.sin(t * 1.8)) * shakeMag;
        
        if (!state.scene.userData.baseCamPos) {
           state.scene.userData.baseCamPos = new THREE.Vector3();
        }
        state.scene.userData.baseCamPos.copy(camera.position);
        
        camera.position.x += shakeX;
        camera.position.y += shakeY;
        camera.position.z += shakeZ;
      }
      
      let defaultFov = 45;
      if (gameMode === 'stumble') {
        defaultFov = stumbleCamera === 'gta' ? 75 : 60;
      } else if (gameMode === 'tennis') {
        defaultFov = tennisCamera === 'gta' ? 75 : 45;
      }
      let targetFov = camConfig?.fov || defaultFov;
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((camera as THREE.PerspectiveCamera).fov, targetFov, 5.0 * delta);
      camera.updateProjectionMatrix();
    }
  });
  
  return null;
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Menu / attract mode management
  useEffect(() => {
    if (screen === 'menu') {
      const store = useEditorStore.getState();
      store.setGameStarted(false);
      store.setIsAutoPlay(true); // attract mode: match plays itself behind the menu
      audioManager.setMuted(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [screen]);

  const handlePlay = () => {
    const store = useEditorStore.getState();
    window.dispatchEvent(new CustomEvent('resetBalls'));
    store.resetMatch();
    store.setServerTurn('player');
    store.setGameMode('tennis');
    store.setIsAutoPlay(false);
    store.setGameStarted(true);
    // Follow whatever sound choice was made in the menu
    setSfxOn(!audioManager.muted);
    audioManager.setMuted(audioManager.muted);
    setScreen('game');
  };

  const handleExitToMenu = () => {
    window.dispatchEvent(new CustomEvent('resetBalls'));
    const store = useEditorStore.getState();
    store.setGameStarted(false);
    store.resetMatch();
    store.setIsAutoPlay(true);
    audioManager.setMuted(true);
    setMusicOn(false);
    setScreen('menu');
  };

  const toggleSfx = () => {
    setSfxOn((s) => {
      audioManager.setMuted(!s ? false : true);
      return !s;
    });
  };

  const toggleMusic = () => {
    setMusicOn((m) => {
      const next = !m;
      if (audioRef.current) {
        audioRef.current.muted = !next;
        audioRef.current.volume = 0.35;
        if (next) {
          audioRef.current.play().catch(() => {});
        }
      }
      return next;
    });
  };

  const [cameraMode, setCameraMode] = useState<'orbit' | 'game'>('game');
  const courtLength = useEditorStore(state => state.courtLength);
  const [camConfig, setCamConfig] = useState({
    tennisGtaTargetY: 3.1,
    tennisGtaTargetZ: 2.8,
    tennisGtaLookY: -4.1,
    tennisGtaLookZ: -15.7,
    stumbleGtaDistance: 3,
    stumbleGtaHeight: 2,
    stumbleGtaLookDist: 5.5,
    stumbleGtaLookY: -0.5,
    stumbleDefaultTargetY: 11,
    stumbleDefaultTargetZ: 11,
    stumbleDefaultLookY: 0,
    stumbleDefaultLookZ: -3,
  });
  const [tennisCamera, setTennisCamera] = useState<'broadcast' | 'gta'>('gta');
  const [showUI, setShowUI] = useState(false);
  const [showCameraSetup, setShowCameraSetup] = useState(false);
  const [environmentTheme, setEnvironmentTheme] = useState<'forest' | 'forest_jpg' | 'snow' | 'beach' | 'park' | 'africa' | 'waterfall' | 'waterfall2'>('beach');
  const [envRadius, setEnvRadius] = useState(103);
  const [envHeight, setEnvHeight] = useState(11);
  const [envScale, setEnvScale] = useState(55);
  const [useEnvGround, setUseEnvGround] = useState(true);
  const [envPosX, setEnvPosX] = useState(0);
  const [envPosY, setEnvPosY] = useState(0);
  const [envPosZ, setEnvPosZ] = useState(0);
  const [envRotY, setEnvRotY] = useState(0);

  const envConfig: Record<string, { files: string, fogColor: string, ambientColor: string, dirColor: string, dirIntensity: number }> = {
    forest: {
      files: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/forest_slope_2k.hdr",
      fogColor: '#8da794',
      ambientColor: '#dbe5d4',
      dirColor: '#ffdcb3',
      dirIntensity: 2.2
    },
    forest_jpg: {
      files: "/forest.jpg",
      fogColor: '#8da794',
      ambientColor: '#dbe5d4',
      dirColor: '#ffdcb3',
      dirIntensity: 2.2
    },
    snow: {
      files: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/rooitou_park_2k.hdr",
      fogColor: '#d6e3ee',
      ambientColor: '#e8f0f8',
      dirColor: '#ffffff',
      dirIntensity: 1.8
    },
    beach: {
      files: "/beach.png",
      fogColor: '#8eb3d4',
      ambientColor: '#e0f0ff',
      dirColor: '#ffebd6',
      dirIntensity: 2.5
    },
    waterfall: {
      files: "/waterfall.png",
      fogColor: '#8da794',
      ambientColor: '#dbe5d4',
      dirColor: '#ffdcb3',
      dirIntensity: 2.2
    },
    waterfall2: {
      files: "/waterfall2.png",
      fogColor: '#8da794',
      ambientColor: '#dbe5d4',
      dirColor: '#ffdcb3',
      dirIntensity: 2.2
    },
    park: {
      files: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/potsdamer_platz_2k.hdr",
      fogColor: '#9bb093',
      ambientColor: '#eaf4e3',
      dirColor: '#ffedcc',
      dirIntensity: 2.0
    },
    africa: {
      files: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kiara_1_dawn_2k.hdr",
      fogColor: '#bfa888',
      ambientColor: '#f2e8d5',
      dirColor: '#ffebbd',
      dirIntensity: 2.4
    }
  };

  const [cameraSettings, setCameraSettings] = useState({
    posX: 0,
    posY: 8,
    posZ: 19.5,
    lookX: 0,
    lookY: -1,
    lookZ: 0
  });
  const characterRef = useRef<THREE.Group>(null);
  const { playerPoints, botPoints, playerGames, botGames, isTieBreak, serverTurn, gameMode } = useEditorStore();
  const courtTheme = useEditorStore(state => state.courtTheme);

  const getTennisScore = (p: number, b: number, isTieBreak: boolean) => {
    if (isTieBreak) return `${p}`; 
    if (p >= 3 && b >= 3) {
       if (p === b) return '40';
       if (p > b) return 'AD';
       return '-';
    }
    const scores = ['0', '15', '30', '40'];
    return scores[p] || '40';
  };

  useEffect(() => {
    if (playerPoints === 0 && botPoints === 0 && playerGames === 0 && botGames === 0) return;
    if (!useEditorStore.getState().gameStarted) return;
    
    if (playerPoints === 0 && botPoints === 0 && (playerGames > 0 || botGames > 0)) {
       audioManager.playCrowd('applause');
       audioManager.announce(`Game, ${serverTurn === 'bot' ? 'Player' : 'Bot'}`);
    } else {
       audioManager.playCrowd('cheer');
       const p = getTennisScore(playerPoints, botPoints, isTieBreak);
       const b = getTennisScore(botPoints, playerPoints, isTieBreak);
       if (p === '40' && b === '40') audioManager.announce('Deuce');
       else if (p === 'AD') audioManager.announce('Advantage Player');
       else if (b === 'AD') audioManager.announce('Advantage Bot');
       else audioManager.announce(`${p} ${b === '0' ? 'Love' : b}`);
    }
  }, [playerPoints, botPoints, playerGames, botGames]);

  useEffect(() => {
    const interval = setInterval(() => {
      audioManager.playEnvironment(environmentTheme);
    }, 8000);
    return () => clearInterval(interval);
  }, [environmentTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setShowUI(prev => !prev);
      }
      if (e.key.toLowerCase() === 'b') {
        const store = useEditorStore.getState();
        const colors = ['yellow', 'cyan', 'purple', 'orange', 'rainbow'] as const;
        const currentIdx = colors.indexOf(store.ballColor);
        store.setBallColor(colors[(currentIdx + 1) % colors.length]);
      }
      if (e.key.toLowerCase() === 'g') {
        const store = useEditorStore.getState();
        store.setSkinType(store.skinType === 'default' ? 'mouse' : (store.skinType === 'mouse' ? 'mumu' : 'default'));
      }
      if (e.key.toLowerCase() === 'v') {
        // Master mute: SFX + music
        const next = audioManager.muted;
        audioManager.setMuted(!next);
        setSfxOn(next);
        if (!next) {
          setMusicOn(false);
          if (audioRef.current) audioRef.current.muted = true;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 via-sky-200 to-orange-100 relative overflow-hidden font-hyper">
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 8, 19.5], fov: 45 }}>
          <color attach="background" args={[envConfig[environmentTheme].fogColor]} />
          <fog attach="fog" args={[envConfig[environmentTheme].fogColor, 20, 100]} />
          <ambientLight intensity={0.6} color={envConfig[environmentTheme].ambientColor} />
          <directionalLight 
             position={[15, 25, 10]} 
             intensity={envConfig[environmentTheme].dirIntensity} 
             color={envConfig[environmentTheme].dirColor} 
             castShadow 
             shadow-mapSize={[2048, 2048]}
             shadow-camera-left={-20}
             shadow-camera-right={20}
             shadow-camera-top={20}
             shadow-camera-bottom={-20}
             shadow-bias={-0.0001}
          />
          <Suspense fallback={null}>
            <DynamicEnvironment 
              themeConfig={envConfig[environmentTheme]} 
              useEnvGround={useEnvGround} 
              envRadius={envRadius} 
              envHeight={envHeight} 
              envScale={envScale} 
              envPosX={envPosX}
              envPosY={envPosY}
              envPosZ={envPosZ}
              envRotY={envRotY}
            />
            <CameraController 
              mode={cameraMode} 
              characterRef={characterRef} 
              settings={cameraSettings} 
              gameMode={gameMode}
              tennisCamera={tennisCamera}
              camConfig={camConfig}
            />
            <TennisCourt theme={courtTheme} />
            <Referee position={[6.2, 0, 0]} />
            <TennisCharacter ref={characterRef} />
            <TennisBall />
            <HitParticles />
          </Suspense>
        </Canvas>
      </div>
      <audio ref={audioRef} src="/Sandy Flip Loop.mp3" loop muted={!musicOn} />
      
      {screen === 'menu' && <MainMenu onPlay={handlePlay} />}

      {screen === 'game' && (
        <>
          <ArcadeTextOverlay />
          <Joystick />
          <ActionButtons />
          <ChargeGauge />
          <ServePowerGauge />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900]">
            <ScoreBoard />
          </div>
          <TopBar
            onExitToMenu={handleExitToMenu}
            sfxOn={sfxOn}
            onToggleSfx={toggleSfx}
            musicOn={musicOn}
            onToggleMusic={toggleMusic}
            onOpenAdvanced={() => setAdvancedOpen(true)}
            tennisCamera={tennisCamera}
            onTennisCamera={setTennisCamera}
          />
        </>
      )}

      {/* Hidden dev editors (toggle with H) */}
      {showUI && (
        <>
          <AnimationEditor />
          <CameraEditor settings={cameraSettings} onChange={setCameraSettings} />
        </>
      )}
      
      <CameraSetupModal 
        isOpen={showCameraSetup} 
        onClose={() => setShowCameraSetup(false)} 
        camConfig={camConfig} 
        setCamConfig={setCamConfig} 
        gameMode={gameMode}
      />

      {/* Advanced editor drawer */}
      {advancedOpen && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 z-[1200]" 
            onClick={() => setAdvancedOpen(false)} 
          />
          <div className="absolute top-0 right-0 h-full w-[360px] max-h-screen overflow-y-auto bg-black/70 backdrop-blur-md border-l border-white/20 shadow-2xl p-4 flex flex-col gap-4 z-[1250] animate-hc-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-extrabold text-lg tracking-wide">🛠️ ADVANCED</h2>
              <button 
                onClick={() => setAdvancedOpen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs text-white/80 bg-black/40 p-2 rounded">
              <div className="font-bold text-white mb-1 border-b border-white/20 pb-1">Keyboard Controls</div>
              <div><kbd className="bg-white/20 px-1 rounded">W/A/S/D</kbd> : Move & Aim</div>
              <div><kbd className="bg-white/20 px-1 rounded">SPACE</kbd> : Toss / Jump</div>
              <div className="mt-1 font-bold text-yellow-300">Shot Types (Hold to Charge):</div>
              <div><kbd className="bg-white/20 px-1 rounded">J</kbd> : Topspin (Fast, Dives)</div>
              <div><kbd className="bg-white/20 px-1 rounded">K</kbd> : Slice (Slow, Low Bounce)</div>
              <div><kbd className="bg-white/20 px-1 rounded">L</kbd> : Lob (High Arc)</div>
              <div><kbd className="bg-white/20 px-1 rounded">M</kbd> : Smash (Matrix Slow-Mo)</div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold border-b border-white/20 pb-1">Game Controls</h3>
              <div className="flex gap-2 flex-wrap">
                {gameMode === 'tennis' && (
                  <>
                    <button onClick={() => useEditorStore.getState().setIsAutoHit(!useEditorStore.getState().isAutoHit)} className={`flex-1 font-bold text-xs px-2 py-1 rounded ${useEditorStore.getState().isAutoHit ? 'bg-orange-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                      AUTO HIT: {useEditorStore.getState().isAutoHit ? 'ON' : 'OFF'}
                    </button>
                    <button 
                      onClick={() => setShowCameraSetup(true)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      🎥 CAMERA TUNING
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Environment */}
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold border-b border-white/20 pb-1">Environment Theme</h3>
              <div className="grid grid-cols-2 gap-2">
                {['forest', 'forest_jpg', 'snow', 'beach', 'park', 'africa', 'waterfall', 'waterfall2'].map(theme => (
                  <button 
                    key={theme}
                    onClick={(e) => { e.stopPropagation(); setEnvironmentTheme(theme as any); }}
                    className={`font-bold py-1 px-2 rounded text-xs ${environmentTheme === theme ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-2 mt-2 bg-black/20 p-2 rounded">
                <label className="flex items-center gap-2 text-white text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={useEnvGround} onChange={(e) => setUseEnvGround(e.target.checked)} />
                  Enable Ground Projection
                </label>
                
                {useEnvGround && (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Radius</span>
                        <span>{envRadius}</span>
                      </div>
                      <input type="range" min="10" max="500" value={envRadius} onChange={(e) => setEnvRadius(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Height</span>
                        <span>{envHeight}</span>
                      </div>
                      <input type="range" min="1" max="100" value={envHeight} onChange={(e) => setEnvHeight(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Scale</span>
                        <span>{envScale}</span>
                      </div>
                      <input type="range" min="10" max="1000" value={envScale} onChange={(e) => setEnvScale(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Pos X</span>
                        <span>{envPosX}</span>
                      </div>
                      <input type="range" min="-100" max="100" step="0.1" value={envPosX} onChange={(e) => setEnvPosX(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Pos Y</span>
                        <span>{envPosY}</span>
                      </div>
                      <input type="range" min="-50" max="50" step="0.1" value={envPosY} onChange={(e) => setEnvPosY(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Pos Z</span>
                        <span>{envPosZ}</span>
                      </div>
                      <input type="range" min="-100" max="100" step="0.1" value={envPosZ} onChange={(e) => setEnvPosZ(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-white">
                        <span>Rotation</span>
                        <span>{envRotY.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0" max="6.28" step="0.01" value={envRotY} onChange={(e) => setEnvRotY(Number(e.target.value))} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <PhysicsEditor />

            {showUI && (
              <div className="flex flex-col gap-4 mt-2 border-t border-white/20 pt-4">
                <CharacterSizeEditor />
                <div className="flex flex-col gap-2">
                  <h3 className="text-white font-bold">Animations</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('playAnim', { detail: 'swing' }))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs">Play Swing</button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('playAnim', { detail: 'anim1' }))} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs">Anim 1</button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('playAnim', { detail: 'anim2' }))} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded text-xs">Anim 2</button>
                    <button onClick={() => setCameraMode(prev => prev === 'orbit' ? 'game' : 'orbit')} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-1 px-2 rounded text-xs">
                      {cameraMode === 'orbit' ? 'Game View' : 'Orbit View'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
