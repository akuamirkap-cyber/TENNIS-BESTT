const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }`,
`  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }`
);

fs.writeFileSync('src/App.tsx', code);
