import React, { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

export const TennisRacket = forwardRef<THREE.Group, {
  partSizes: any;
  color?: string;
  visible?: boolean;
  position?: [number, number, number];
}>(({ partSizes, color = "#3A82C4", visible = true, position = [0, -0.45, 0] }, ref) => {
  const length = partSizes.racketLength;
  const headSize = partSizes.racketHead;

  // --- RACKET NET (jaring) ---
  // A crisp cross-hatch grid drawn on a canvas texture, mapped onto the string
  // bed. Much more visible at gameplay distance than ultra-thin 3D lines.
  const netTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 320);
      // Soft membrane behind the strings for depth
      ctx.fillStyle = 'rgba(235, 244, 255, 0.16)';
      ctx.fillRect(0, 0, 256, 320);
      // String grid — bright white with a hint of ice blue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const step = 24;
      for (let x = step / 2; x < 256; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 320);
        ctx.stroke();
      }
      for (let y = step / 2; y < 320; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <group ref={ref} visible={visible} position={position} rotation={[Math.PI / 2 + 0.2, 0, 0]} scale={[partSizes.racket, partSizes.racket, partSizes.racket]}>
      <group rotation={[0, Math.PI / 2, 0]}>
        {/* Handle and Shaft (Scaled by length) */}
        <group scale={[1, length, 1]}>
          {/* Grip Base */}
          <mesh position={[0, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.04]} />
            <meshStandardMaterial color="#1a5a8e" roughness={0.8} />
          </mesh>
          {/* Grip */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.4]} />
            <meshStandardMaterial color="#1f69a5" roughness={0.8} />
          </mesh>
          {/* Lower Shaft */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.035, 0.1]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>

        {/* Throat and Head (Positioned dynamically, scaled by headSize) */}
        <group position={[0, length * 0.5, 0]} scale={[headSize, headSize, headSize]}>

          {/* Left Throat Branch */}
          <mesh position={[-0.06, 0.15, 0]} rotation={[0, 0, 0.25]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.32]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Right Throat Branch */}
          <mesh position={[0.06, 0.15, 0]} rotation={[0, 0, -0.25]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.32]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Bridge (bottom of the head) */}
          <mesh position={[0, 0.29, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.24]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Head Frame */}
          {/* A tennis racket head is oval. We scale a torus on Y. */}
          <group position={[0, 0.61, 0]} scale={[1.05, 1.35, 1]}>
            {/* Chunky outer frame */}
            <mesh castShadow>
              <torusGeometry args={[0.26, 0.028, 16, 48]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Inner frame rim (cartoon outline feel) */}
            <mesh>
              <torusGeometry args={[0.235, 0.008, 12, 40]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>

            {/* THE NET — cross-hatch string bed (canvas texture) */}
            <mesh>
              <circleGeometry args={[0.243, 48]} />
              <meshBasicMaterial
                map={netTexture}
                transparent
                opacity={0.95}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* A few thicker 3D cross-strings for parallax depth when swinging */}
            {[-0.1, 0, 0.1].map((yPos, i) => (
              <mesh key={`h3d-${i}`} position={[0, yPos, 0.004]}>
                <boxGeometry args={[0.46 * Math.cos(Math.asin(yPos / 0.25)), 0.004, 0.004]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
            {[-0.075, 0.075].map((xPos, i) => (
              <mesh key={`v3d-${i}`} position={[xPos, 0, 0.004]}>
                <boxGeometry args={[0.004, 0.46 * Math.cos(Math.asin(xPos / 0.25)), 0.004]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
});
