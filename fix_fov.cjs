const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`      let targetFov = camConfig?.fov || 45;
      if (gameMode === 'stumble') {
        targetFov = stumbleCamera === 'gta' ? 75 : 60;
      } else if (gameMode === 'tennis') {
        targetFov = tennisCamera === 'gta' ? 75 : 45;
      }`,
`      let defaultFov = 45;
      if (gameMode === 'stumble') {
        defaultFov = stumbleCamera === 'gta' ? 75 : 60;
      } else if (gameMode === 'tennis') {
        defaultFov = tennisCamera === 'gta' ? 75 : 45;
      }
      let targetFov = camConfig?.fov || defaultFov;`
);

// Add the Camera Setup Button to the UI
// Look for ArcadeTextOverlay and insert CameraSetupModal logic there
code = code.replace(
`import { ArcadeTextOverlay } from './components/ArcadeTextOverlay';`,
`import { ArcadeTextOverlay } from './components/ArcadeTextOverlay';
import { CameraSetupModal } from './components/CameraSetupModal';`
);

code = code.replace(
`  const [showUI, setShowUI] = useState(false);`,
`  const [showUI, setShowUI] = useState(false);
  const [showCameraSetup, setShowCameraSetup] = useState(false);`
);

code = code.replace(
`      <Joystick />`,
`      <Joystick />
      
      {/* Camera Setup Toggle Button */}
      <button 
        onClick={() => setShowCameraSetup(true)}
        className="absolute bottom-4 right-4 z-50 bg-white/20 hover:bg-white/40 backdrop-blur text-white p-3 rounded-full shadow-lg border border-white/30 flex items-center justify-center transition-all"
        title="Camera Setup"
      >
        🎥
      </button>

      <CameraSetupModal 
        isOpen={showCameraSetup} 
        onClose={() => setShowCameraSetup(false)} 
        camConfig={camConfig} 
        setCamConfig={setCamConfig} 
        gameMode={gameMode}
      />`
);


fs.writeFileSync('src/App.tsx', code);
