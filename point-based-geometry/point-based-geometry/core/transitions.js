// ═══════════════════════════════════════════════════════════
//  PointMorph — Transitions Registry (ES Module)
//  Registers all 9 transition presets
// ═══════════════════════════════════════════════════════════

import { PointMorph } from './PointMorph.js';

export function registerAllTransitions() {
  const T = PointMorph.registerTransition;

  T('direct', function (f, to, t) {
    return { x: f.x + (to.x - f.x) * t, y: f.y + (to.y - f.y) * t, z: f.z + (to.z - f.z) * t };
  });

  T('explode', function (f, to, t, i, count, R, inst) {
    var mx = (f.x + to.x) * 0.5, my = (f.y + to.y) * 0.5, mz = (f.z + to.z) * 0.5;
    var len = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
    var rnd = PointMorph._getTransRand(inst, count);
    var exR = R * (1.5 + rnd[i * 3] * 1.5);
    var dx = mx / len, dy = my / len, dz = mz / len;
    if (t < 0.4) {
      var p = Math.sin((t / 0.4) * Math.PI * 0.5);
      return { x: f.x + (dx * exR - f.x) * p, y: f.y + (dy * exR - f.y) * p, z: f.z + (dz * exR - f.z) * p };
    } else {
      var p2 = ((t - 0.4) / 0.6) * ((t - 0.4) / 0.6);
      return { x: dx * exR + (to.x - dx * exR) * p2, y: dy * exR + (to.y - dy * exR) * p2, z: dz * exR + (to.z - dz * exR) * p2 };
    }
  });

  T('implode', function (f, to, t) {
    if (t < 0.4) {
      var p = (t / 0.4) * (t / 0.4);
      return { x: f.x * (1 - p), y: f.y * (1 - p), z: f.z * (1 - p) };
    } else {
      var p2 = 1 - Math.pow(1 - (t - 0.4) / 0.6, 2);
      return { x: to.x * p2, y: to.y * p2, z: to.z * p2 };
    }
  });

  T('wave', function (f, to, t, i, count, R) {
    var yN = (f.y / R + 1) * 0.5, delay = yN * 0.5;
    var lt = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
    var st = lt * lt * (3 - 2 * lt);
    var wave = Math.sin(lt * Math.PI) * R * 0.3 * Math.sin(yN * Math.PI * 4 + t * Math.PI * 2);
    return { x: f.x + (to.x - f.x) * st + wave * 0.3, y: f.y + (to.y - f.y) * st, z: f.z + (to.z - f.z) * st + wave * 0.3 };
  });

  T('spiral', function (f, to, t) {
    var ft = t * t * (3 - 2 * t);
    var lx = f.x + (to.x - f.x) * ft, ly = f.y + (to.y - f.y) * ft, lz = f.z + (to.z - f.z) * ft;
    var ss = Math.sin(t * Math.PI), angle = t * Math.PI * 3 * ss;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    return { x: lx * ca - lz * sa, y: ly, z: lx * sa + lz * ca };
  });

  T('scatter', function (f, to, t, i, count, R, inst) {
    var rnd = PointMorph._getTransRand(inst, count);
    var rx = (rnd[i * 3] - 0.5) * R * 4, ry = (rnd[i * 3 + 1] - 0.5) * R * 4, rz = (rnd[i * 3 + 2] - 0.5) * R * 4;
    var scatter = Math.sin(t * Math.PI), ft = t * t * (3 - 2 * t);
    return {
      x: f.x + (to.x - f.x) * ft + rx * scatter * 0.6,
      y: f.y + (to.y - f.y) * ft + ry * scatter * 0.6,
      z: f.z + (to.z - f.z) * ft + rz * scatter * 0.6
    };
  });

  T('cascade', function (f, to, t, i, count) {
    var norm = i / count, delay = norm * 0.6;
    var lt = Math.max(0, Math.min(1, (t - delay) / 0.4));
    var st = lt < 1 ? lt * lt * (2.7 * lt - 1.7) : 1;
    return { x: f.x + (to.x - f.x) * st, y: f.y + (to.y - f.y) * st, z: f.z + (to.z - f.z) * st };
  });

  T('flip', function (f, to, t) {
    var ft = t * t * (3 - 2 * t);
    var fa = t * Math.PI, ca = Math.cos(fa), sc = Math.abs(ca) * 0.5 + 0.5;
    var lx = f.x + (to.x - f.x) * ft, ly = f.y + (to.y - f.y) * ft, lz = f.z + (to.z - f.z) * ft;
    return { x: lx * sc, y: ly, z: lz * ca };
  });

  T('blur', function (f, to, t, i, count, R, inst) {
    var rnd = PointMorph._getTransRand(inst, count);
    // Smooth interpolation with gentle spatial jitter
    var ft = t * t * (3 - 2 * t);
    var blur = Math.sin(t * Math.PI);
    // Subtle position offset — just enough to feel "unfocused", not chaotic
    var jitter = R * 0.25 * blur;
    var ox = (rnd[i * 3] - 0.5) * 2 * jitter;
    var oy = (rnd[i * 3 + 1] - 0.5) * 2 * jitter;
    var oz = (rnd[i * 3 + 2] - 0.5) * 2 * jitter;
    return {
      x: f.x + (to.x - f.x) * ft + ox,
      y: f.y + (to.y - f.y) * ft + oy,
      z: f.z + (to.z - f.z) * ft + oz
    };
  });
}
