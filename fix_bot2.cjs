const fs = require('fs');
let code = fs.readFileSync('src/components/TennisCharacter.tsx', 'utf8');

code = code.replace(
`        if (dist > 0.5) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
        }`,
`        if (dist > 0.05) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
        } else {
          moveX = 0;
          moveZ = 0;
        }`
);

fs.writeFileSync('src/components/TennisCharacter.tsx', code);
