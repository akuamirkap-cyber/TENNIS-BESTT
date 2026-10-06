const fs = require('fs');
let code = fs.readFileSync('src/utils/audio.ts', 'utf8');

code = code.replace(
`  announce(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);`,
`  announce(text: string) {
    if ('speechSynthesis' in window) {
      // Removed window.speechSynthesis.cancel() so it queues instead of cutting off
      const utterance = new SpeechSynthesisUtterance(text);`
);

fs.writeFileSync('src/utils/audio.ts', code);
