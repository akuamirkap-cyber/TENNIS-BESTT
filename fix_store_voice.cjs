const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(
`      if (announcement && state.gameMode === 'tennis') {
          setTimeout(() => {
              import('./utils/audio').then(m => m.audioManager.announce(announcement));
          }, 1500);
      }`,
`      if (announcement && state.gameMode === 'tennis') {
          setTimeout(() => {
              import('./utils/audio').then(m => m.audioManager.announce(announcement));
          }, 1500);
      }`
);

// Actually, I don't need to change store.ts if the delay of 1.5s is intentional (to wait for "Point" to finish).
// Wait, the user says "suara narator telat". Let's remove the setTimeout in store.ts?
// If I remove setTimeout, "15 Love" might cancel "Point".
