const fs = require('fs');
let code = fs.readFileSync('src/components/ArcadeTextOverlay.tsx', 'utf8');

code = code.replace(
`              if ((window as any).audioManager) {
                  (window as any).audioManager.announce(announceText);
              } else {
                  audioManager.announce(announceText);
              }`,
`              audioManager.announce(announceText);`
);

fs.writeFileSync('src/components/ArcadeTextOverlay.tsx', code);
