const fs = require('fs');
let code = fs.readFileSync('src/components/ArcadeTextOverlay.tsx', 'utf8');

code = code.replace(
`          const announceText = e.detail === 'POINT!' || e.detail === 'ACE!' ? 'Point' : (e.detail === 'SWEET SPOT!' ? '' : e.detail);`,
`          const announceText = e.detail === 'POINT!' || e.detail === 'ACE!' ? 'Point' : (e.detail === 'SWEET SPOT!' || e.detail === 'FRAME HIT!' ? '' : e.detail.replace('!', '').toLowerCase());`
);

fs.writeFileSync('src/components/ArcadeTextOverlay.tsx', code);
