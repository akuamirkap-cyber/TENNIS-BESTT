const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`  const [camConfig, setCamConfig] = useState({
    tennisGtaTargetY: 4,
    tennisGtaTargetZ: 4,
    tennisGtaLookY: -0.5,
    tennisGtaLookZ: -12,`,
`  const [camConfig, setCamConfig] = useState({
    tennisGtaTargetY: 3.1,
    tennisGtaTargetZ: 2.8,
    tennisGtaLookY: -4.1,
    tennisGtaLookZ: -15.7,`
);

fs.writeFileSync('src/App.tsx', code);
