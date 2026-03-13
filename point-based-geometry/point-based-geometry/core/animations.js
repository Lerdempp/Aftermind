// ═══════════════════════════════════════════════════════════
//  PointMorph — Animation Presets Registry (ES Module)
//  Idle animation presets that run when not morphing
//
//  Each animation fn(base, i, count, time, speed, intensity, R)
//  returns {x, y, z} — the animated position for that frame.
// ═══════════════════════════════════════════════════════════

import { PointMorph } from './PointMorph.js';

export function registerAllAnimations() {
  const A = PointMorph.registerAnimation;

  // ─── Pulse: radial breathing ───
  A('pulse', function (b, i, count, time, speed, intensity, R) {
    var d = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z) || 1;
    var p = 1 + Math.sin(time * speed + d * 0.5) * intensity;
    return { x: b.x * p, y: b.y * p, z: b.z * p };
  });

  // ─── Wave: horizontal wave ripple along Y axis ───
  A('wave', function (b, i, count, time, speed, intensity, R) {
    var normalizedY = (b.y / R + 1) * 0.5; // 0..1
    var wave = Math.sin(time * speed * 2 + normalizedY * Math.PI * 4) * intensity * R * 0.3;
    return {
      x: b.x + wave * 0.5,
      y: b.y,
      z: b.z + wave * 0.5
    };
  });

  // ─── Diagonal Wave: wave along X+Y diagonal ───
  A('diagonalWave', function (b, i, count, time, speed, intensity, R) {
    var diag = (b.x + b.y) / (R * 2);
    var wave = Math.sin(time * speed * 1.8 + diag * Math.PI * 5) * intensity * R * 0.25;
    return {
      x: b.x + wave * 0.4,
      y: b.y + wave * 0.4,
      z: b.z + wave * 0.4
    };
  });

  // ─── Breathe: slow uniform scale in/out ───
  A('breathe', function (b, i, count, time, speed, intensity, R) {
    var scale = 1 + Math.sin(time * speed * 0.5) * intensity * 0.4;
    return { x: b.x * scale, y: b.y * scale, z: b.z * scale };
  });

  // ─── Float: gentle upward drift with return ───
  A('float', function (b, i, count, time, speed, intensity, R) {
    var phase = (i / count) * Math.PI * 2;
    var drift = Math.sin(time * speed * 0.7 + phase) * intensity * R * 0.15;
    var sway = Math.cos(time * speed * 0.4 + phase * 0.5) * intensity * R * 0.08;
    return {
      x: b.x + sway,
      y: b.y + drift,
      z: b.z
    };
  });

  // ─── Twist: rotational oscillation around Y axis ───
  A('twist', function (b, i, count, time, speed, intensity, R) {
    var heightNorm = (b.y / R + 1) * 0.5;
    var angle = Math.sin(time * speed) * intensity * 0.8 * heightNorm;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    return {
      x: b.x * ca - b.z * sa,
      y: b.y,
      z: b.x * sa + b.z * ca
    };
  });

  // ─── Jelly: elastic wobble deformation ───
  A('jelly', function (b, i, count, time, speed, intensity, R) {
    var d = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z) || 1;
    var phase = d * 2 + time * speed * 2;
    var sx = 1 + Math.sin(phase) * intensity * 0.3;
    var sy = 1 + Math.sin(phase + Math.PI * 0.66) * intensity * 0.3;
    var sz = 1 + Math.sin(phase + Math.PI * 1.33) * intensity * 0.3;
    return { x: b.x * sx, y: b.y * sy, z: b.z * sz };
  });

  // ─── Orbit: points orbit around their base position ───
  A('orbit', function (b, i, count, time, speed, intensity, R) {
    var phase = (i / count) * Math.PI * 2;
    var orbR = intensity * R * 0.12;
    var a = time * speed * 1.5 + phase;
    return {
      x: b.x + Math.cos(a) * orbR,
      y: b.y + Math.sin(a * 0.7) * orbR * 0.5,
      z: b.z + Math.sin(a) * orbR
    };
  });
}
