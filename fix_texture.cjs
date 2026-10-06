const fs = require('fs');
let code = fs.readFileSync('src/components/TennisBall.tsx', 'utf8');
const search = `  const ballTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.fillStyle = '#b5cc18';
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (let i = 0; i <= 512; i++) {
      const x = i;
      const a = (x / 512) * Math.PI * 4; 
      const y = 128 + Math.sin(a) * 70;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);`;
const replace = `  const ballTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    if (ballColor === 'rainbow') {
      const grad = ctx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, '#ff3366');
      grad.addColorStop(0.2, '#ff9933');
      grad.addColorStop(0.4, '#ffff33');
      grad.addColorStop(0.6, '#33cc33');
      grad.addColorStop(0.8, '#3399ff');
      grad.addColorStop(1, '#cc33cc');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = ballColor === 'cyan' ? '#57d4cc' : 
                      ballColor === 'purple' ? '#9b59b6' : 
                      ballColor === 'orange' ? '#ff8c00' : 
                      '#b5cc18';
    }
    
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (let i = 0; i <= 512; i++) {
      const x = i;
      const a = (x / 512) * Math.PI * 4; 
      const y = 128 + Math.sin(a) * 70;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [ballColor]);`;
if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/components/TennisBall.tsx', code);
    console.log("Fixed successfully.");
} else {
    console.log("Search string not found!");
}
