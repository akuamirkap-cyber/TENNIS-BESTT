const fs = require('fs');
let code = fs.readFileSync('src/components/BotCharacter.tsx', 'utf8');

// Replace the dist > 0.1 checks for recovering
code = code.replace(
`      if (dist > 0.1) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
          isRecovering = true;
        }`,
`      if (dist > 0.05) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
          isRecovering = true;
      } else {
          // Force stop if very close to prevent jitter
          if (!characterRef.current.userData.currentVel) characterRef.current.userData.currentVel = {x: 0, z: 0};
          characterRef.current.userData.currentVel.x = 0;
          characterRef.current.userData.currentVel.z = 0;
      }`
);

code = code.replace(
`            if (dist > 0.1) {
              moveX = coverX - characterRef.current.position.x;
              moveZ = coverZ - characterRef.current.position.z;
              isRecovering = true;
            }`,
`            if (dist > 0.05) {
              moveX = coverX - characterRef.current.position.x;
              moveZ = coverZ - characterRef.current.position.z;
              isRecovering = true;
            } else {
              if (!characterRef.current.userData.currentVel) characterRef.current.userData.currentVel = {x: 0, z: 0};
              characterRef.current.userData.currentVel.x = 0;
              characterRef.current.userData.currentVel.z = 0;
            }`
);

code = code.replace(
`        if (dist > 0.1) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
          isRecovering = true;
        }`,
`        if (dist > 0.05) {
          moveX = homeX - characterRef.current.position.x;
          moveZ = homeZ - characterRef.current.position.z;
          isRecovering = true;
        } else {
          if (!characterRef.current.userData.currentVel) characterRef.current.userData.currentVel = {x: 0, z: 0};
          characterRef.current.userData.currentVel.x = 0;
          characterRef.current.userData.currentVel.z = 0;
        }`
);

// Normalize the length smoothly
code = code.replace(
`    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
          const targetLength = Math.min(1.0, length);
          moveX = (moveX / length) * targetLength;
          moveZ = (moveZ / length) * targetLength;
      }
    }`,
`    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
          const targetLength = isRecovering ? Math.min(1.0, length * 2.0) : 1.0;
          moveX = (moveX / length) * targetLength;
          moveZ = (moveZ / length) * targetLength;
      }
    }`
);

fs.writeFileSync('src/components/BotCharacter.tsx', code);
