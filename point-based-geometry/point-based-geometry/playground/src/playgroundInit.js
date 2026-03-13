import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointMorph, registerAllTransitions, registerAllAnimations } from '@core';

// Register all transitions and animations at module level
registerAllTransitions();
registerAllAnimations();

// ═══════════════════════════════════════════════════
//  PointMorph Playground — Imperative initialization
// ═══════════════════════════════════════════════════

export function initPlayground() {
  // Configuration defaults
  const configDefaults = {
    pointCount: 12000,
    radius: 4,
    spread: 0.3,
    pointSize: 2.5,
    orbitSpeed: 0.3,
    animationPreset: 'pulse',
    animationIntensity: 0.15,
    animationSpeed: 1.5,
    autoRotate: true,
    shape: 'circle',
    morphTarget: 'default',
    morphSpeed: 2,
    morphEasing: 'smooth',
    morphTransition: 'direct',
    customBezier: [0.25, 0.1, 0.25, 1],
    colorMode: 'gradient',
    pointColor: '#a78bfa',
    gradientEnd: '#60a5fa',
    opacity: 0.85,
    bgColor: '#0a0a0f',
    blendMode: 'additive',
    sizeAttenuation: true,
    depthFade: true,
    sparkle: false,
    fillVertexGap: true,
    pointDensity: 1.0
  };

  const STORAGE_KEY = 'pointmorph_config';

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = { ...configDefaults };
        for (const key of Object.keys(configDefaults)) {
          if (key in parsed) {
            if (key === 'morphTarget' && String(parsed[key]).startsWith('model_')) {
              restored[key] = 'default';
            } else {
              restored[key] = parsed[key];
            }
          }
        }
        return restored;
      }
    } catch (e) {
      console.warn('Failed to load config:', e);
    }
    return { ...configDefaults };
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  }

  const config = loadConfig();

  // Three.js scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.bgColor);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // Utility functions
  function createShapeTexture(shape) {
    const s = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const cx = s / 2;
    const cy = s / 2;
    const r = s / 2 - 4;

    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = 'white';

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star': {
        const sp = 5;
        const oR = r;
        const iR = r * 0.4;
        ctx.beginPath();
        for (let i = 0; i < sp * 2; i++) {
          const a = (i * Math.PI) / sp - Math.PI / 2;
          const rd = i % 2 === 0 ? oR : iR;
          if (i === 0) {
            ctx.moveTo(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
          } else {
            ctx.lineTo(cx + Math.cos(a) * rd, cy + Math.sin(a) * rd);
          }
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy + r * 0.8);
        ctx.lineTo(cx - r, cy + r * 0.8);
        ctx.closePath();
        ctx.fill();
        break;
      case 'ring':
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'cross': {
        const w = r * 0.4;
        ctx.fillRect(cx - w, cy - r, w * 2, r * 2);
        ctx.fillRect(cx - r, cy - w, r * 2, w * 2);
        break;
      }
      case 'hex':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 6;
          if (i === 0) {
            ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          } else {
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
        }
        ctx.closePath();
        ctx.fill();
        break;
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function hexToRGB(h) {
    const c = parseInt(h.slice(1), 16);
    return {
      r: ((c >> 16) & 255) / 255,
      g: ((c >> 8) & 255) / 255,
      b: (c & 255) / 255
    };
  }

  function hslToRGB(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const f = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = f(p, q, h + 1 / 3);
      g = f(p, q, h);
      b = f(p, q, h - 1 / 3);
    }
    return { r, g, b };
  }

  function easeSmooth(t) {
    return t * t * (3 - 2 * t);
  }

  function easeElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  }

  function easeBounce(t) {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  }

  function easeCustomBezier(t) {
    const [x1, y1, x2, y2] = config.customBezier;
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    let lo = 0;
    let hi = 1;
    let mid;
    for (let i = 0; i < 20; i++) {
      mid = (lo + hi) / 2;
      const bx = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid;
      if (bx < t) lo = mid;
      else hi = mid;
    }
    mid = (lo + hi) / 2;
    return 3 * (1 - mid) * (1 - mid) * mid * y1 + 3 * (1 - mid) * mid * mid * y2 + mid * mid * mid;
  }

  function getEasing(n) {
    return {
      smooth: easeSmooth,
      elastic: easeElastic,
      bounce: easeBounce,
      linear: (t) => t,
      custom: easeCustomBezier
    }[n] || easeSmooth;
  }

  // Morph transition support
  let _transRand = null;
  let _transRandCount = 0;

  function playgroundGetTransRand(count) {
    if (_transRand && _transRandCount === count) return _transRand;
    _transRand = new Float32Array(count * 3);
    let s = 12345;
    for (let i = 0; i < count * 3; i++) {
      s = (s * 16807 + 0) % 2147483647;
      _transRand[i] = s / 2147483647;
    }
    _transRandCount = count;
    return _transRand;
  }

  const _origGetTransRand = PointMorph._getTransRand;
  PointMorph._getTransRand = function(inst, count) {
    if (inst && inst instanceof PointMorph) return _origGetTransRand(inst, count);
    return playgroundGetTransRand(count);
  };

  function getTransition(name) {
    const fn = PointMorph._transitions[name] || PointMorph._transitions['direct'];
    if (!fn) {
      return function(f, to, t) {
        return {
          x: f.x + (to.x - f.x) * t,
          y: f.y + (to.y - f.y) * t,
          z: f.z + (to.z - f.z) * t
        };
      };
    }
    return function(f, to, t, i, count, R) {
      return fn(f, to, t, i, count, R, null);
    };
  }

  function getBlend() {
    return {
      additive: THREE.AdditiveBlending,
      normal: THREE.NormalBlending,
      multiply: THREE.MultiplyBlending,
      subtractive: THREE.SubtractiveBlending
    }[config.blendMode] || THREE.AdditiveBlending;
  }

  // ─── Model Library ────────────────────────
  const modelLibrary = [];

  function parseOBJVertices(text) {
    const vertices = [];
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 4) {
          vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        }
      }
    }
    return new Float32Array(vertices);
  }

  function extractGLTFVertices(gltf) {
    const allVertices = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const posAttr = child.geometry.getAttribute('position');
        if (posAttr) {
          child.updateWorldMatrix(true, false);
          const matrix = child.matrixWorld;
          const vec = new THREE.Vector3();
          for (let i = 0; i < posAttr.count; i++) {
            vec.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            vec.applyMatrix4(matrix);
            allVertices.push(vec.x, vec.y, vec.z);
          }
        }
      }
    });
    return new Float32Array(allVertices);
  }

  function normalizeVertices(rawVertices, targetRadius) {
    if (rawVertices.length < 3) return rawVertices;
    const count = rawVertices.length / 3;

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < count; i++) {
      const x = rawVertices[i * 3];
      const y = rawVertices[i * 3 + 1];
      const z = rawVertices[i * 3 + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const sx = maxX - minX;
    const sy = maxY - minY;
    const sz = maxZ - minZ;
    const maxSpan = Math.max(sx, sy, sz) || 1;
    const scale = (targetRadius * 2) / maxSpan;

    const result = new Float32Array(rawVertices.length);
    for (let i = 0; i < count; i++) {
      result[i * 3] = (rawVertices[i * 3] - cx) * scale;
      result[i * 3 + 1] = (rawVertices[i * 3 + 1] - cy) * scale;
      result[i * 3 + 2] = (rawVertices[i * 3 + 2] - cz) * scale;
    }
    return result;
  }

  function buildVertexNeighbors(verts, K) {
    const n = verts.length / 3;
    K = Math.min(K, n - 1);
    if (K <= 0) return null;
    const neighbors = new Uint32Array(n * K);

    // Grid-based spatial hash for fast neighbor search
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < n; i++) {
      const o = i * 3;
      const x = verts[o];
      const y = verts[o + 1];
      const z = verts[o + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const res = Math.max(4, Math.min(48, Math.ceil(Math.cbrt(n / 8))));
    const cellSize = span / res;
    const invCell = 1 / cellSize;

    // First pass: count vertices per cell
    const cellIdx = new Uint32Array(n);
    const cellCount = new Uint32Array(res * res * res);
    for (let i = 0; i < n; i++) {
      const o = i * 3;
      const ix = Math.min(res - 1, Math.max(0, ((verts[o] - minX) * invCell) | 0));
      const iy = Math.min(res - 1, Math.max(0, ((verts[o + 1] - minY) * invCell) | 0));
      const iz = Math.min(res - 1, Math.max(0, ((verts[o + 2] - minZ) * invCell) | 0));
      const ci = ix + iy * res + iz * res * res;
      cellIdx[i] = ci;
      cellCount[ci]++;
    }

    // Prefix sum to get cell offsets
    const totalCells = res * res * res;
    const cellStart = new Uint32Array(totalCells + 1);
    for (let i = 0; i < totalCells; i++) cellStart[i + 1] = cellStart[i] + cellCount[i];

    // Fill sorted vertex indices
    const sorted = new Uint32Array(n);
    const writePos = new Uint32Array(totalCells);
    for (let i = 0; i < n; i++) {
      const ci = cellIdx[i];
      sorted[cellStart[ci] + writePos[ci]] = i;
      writePos[ci]++;
    }

    // For each vertex, search nearby cells for K neighbors
    const heapD = new Float64Array(K);
    const heapI = new Uint32Array(K);

    for (let i = 0; i < n; i++) {
      const o = i * 3;
      const px = verts[o];
      const py = verts[o + 1];
      const pz = verts[o + 2];
      const cix = Math.min(res - 1, Math.max(0, ((px - minX) * invCell) | 0));
      const ciy = Math.min(res - 1, Math.max(0, ((py - minY) * invCell) | 0));
      const ciz = Math.min(res - 1, Math.max(0, ((pz - minZ) * invCell) | 0));

      let found = 0;
      heapD.fill(Infinity);

      // Search shells r=0,1,2
      for (let r = 0; r <= 2 && found < K; r++) {
        const lo = r === 0 ? 0 : -r;
        const hi = r;

        for (let dx = lo; dx <= hi; dx++) {
          const nx = cix + dx;
          if (nx < 0 || nx >= res) continue;

          for (let dy = lo; dy <= hi; dy++) {
            const ny = ciy + dy;
            if (ny < 0 || ny >= res) continue;

            for (let dz = lo; dz <= hi; dz++) {
              // Skip inner cells on shell>0
              if (r > 0 && dx > lo && dx < hi && dy > lo && dy < hi && dz > lo && dz < hi) continue;

              const nz = ciz + dz;
              if (nz < 0 || nz >= res) continue;

              const ci = nx + ny * res + nz * res * res;
              const start = cellStart[ci];
              const end = cellStart[ci + 1];

              for (let s = start; s < end; s++) {
                const j = sorted[s];
                if (j === i) continue;

                const jo = j * 3;
                const ex = verts[jo] - px;
                const ey = verts[jo + 1] - py;
                const ez = verts[jo + 2] - pz;
                const d2 = ex * ex + ey * ey + ez * ez;

                if (found < K) {
                  heapD[found] = d2;
                  heapI[found] = j;
                  found++;

                  if (found === K) {
                    for (let a = 0; a < K; a++) {
                      for (let b = a + 1; b < K; b++) {
                        if (heapD[b] > heapD[a]) {
                          const td = heapD[a];
                          const ti = heapI[a];
                          heapD[a] = heapD[b];
                          heapI[a] = heapI[b];
                          heapD[b] = td;
                          heapI[b] = ti;
                        }
                      }
                    }
                  }
                } else if (d2 < heapD[0]) {
                  heapD[0] = d2;
                  heapI[0] = j;

                  for (let b = 1; b < K; b++) {
                    if (heapD[b] > heapD[0]) {
                      const td = heapD[0];
                      const ti = heapI[0];
                      heapD[0] = heapD[b];
                      heapI[0] = heapI[b];
                      heapD[b] = td;
                      heapI[b] = ti;
                    }
                  }
                }
              }
            }
          }
        }
      }

      const tmp = [];
      for (let k = 0; k < Math.min(found, K); k++) {
        tmp.push({ d: heapD[k], i: heapI[k] });
      }
      tmp.sort((a, b) => a.d - b.d);
      for (let k = 0; k < K; k++) {
        neighbors[i * K + k] = k < tmp.length ? tmp[k].i : tmp.length > 0 ? tmp[tmp.length - 1].i : 0;
      }
    }

    return { neighbors, K };
  }

  function genModelMorphTarget(modelEntry, idx, count, R) {
    if (!modelEntry._normalizedCache) {
      if (modelEntry._rawVertices) {
        modelEntry._normalizedCache = normalizeVertices(modelEntry._rawVertices, R);
        modelEntry._neighbors = buildVertexNeighbors(modelEntry._normalizedCache, 4);
      } else {
        const phi = Math.acos(1 - 2 * (idx + 0.5) / count);
        const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
        return {
          x: R * Math.sin(phi) * Math.cos(theta),
          y: R * Math.sin(phi) * Math.sin(theta),
          z: R * Math.cos(phi)
        };
      }
    }

    const verts = modelEntry._normalizedCache;
    const modelCount = verts.length / 3;

    if (modelCount === 0) return { x: 0, y: 0, z: 0 };

    if (count <= modelCount) {
      const vi = Math.floor((idx / count) * modelCount);
      return { x: verts[vi * 3], y: verts[vi * 3 + 1], z: verts[vi * 3 + 2] };
    }

    const layer = Math.floor(idx / modelCount);
    const baseIdx = idx % modelCount;

    if (layer === 0) {
      return { x: verts[baseIdx * 3], y: verts[baseIdx * 3 + 1], z: verts[baseIdx * 3 + 2] };
    }

    const bx = verts[baseIdx * 3];
    const by = verts[baseIdx * 3 + 1];
    const bz = verts[baseIdx * 3 + 2];

    const nb = modelEntry._neighbors;
    if (nb && nb.K > 0) {
      const hash = ((idx * 2654435761) >>> 0) / 4294967296;
      const nIdx = nb.neighbors[baseIdx * nb.K + ((layer - 1) % nb.K)];

      const nx = verts[nIdx * 3];
      const ny = verts[nIdx * 3 + 1];
      const nz = verts[nIdx * 3 + 2];

      const t = hash * 0.85 + 0.05;
      return {
        x: bx + (nx - bx) * t,
        y: by + (ny - by) * t,
        z: bz + (nz - bz) * t
      };
    }

    return { x: bx, y: by, z: bz };
  }

  function genMorphTarget(type, idx, count, R) {
    const modelEntry = modelLibrary.find((m) => m.id === type);
    if (modelEntry) return genModelMorphTarget(modelEntry, idx, count, R);

    // Fallback: fibonacci sphere
    const phi = Math.acos(1 - 2 * (idx + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
    return {
      x: R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.sin(phi) * Math.sin(theta),
      z: R * Math.cos(phi)
    };
  }

  // ─── Geometry & Material ──────────────────
  let geometry;
  let material;
  let points;
  let basePositions = [];
  let morphFrom = [];
  let morphTo = [];
  let morphProgress = 1;
  let isMorphing = false;

  let _buildId = 0;

  function createSphere() {
    const buildId = ++_buildId;

    if (points) {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      points = null;
    }

    const count = config.pointCount;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    const newBase = new Array(count);

    const c1 = hexToRGB(config.pointColor);
    const c2 = hexToRGB(config.gradientEnd);
    const mt = config.morphTarget;
    const R = config.radius;
    const sp = config.spread;
    const cm = config.colorMode;
    const ps = config.pointSize;

    const CHUNK = 8000;
    let offset = 0;

    function processChunk() {
      if (buildId !== _buildId) return;

      const end = Math.min(offset + CHUNK, count);
      for (let i = offset; i < end; i++) {
        let p = genMorphTarget(mt, i, count, R);
        const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
        const so = (Math.random() - 0.5) * 2 * sp;

        p.x += (p.x / len) * so;
        p.y += (p.y / len) * so;
        p.z += (p.z / len) * so;

        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
        newBase[i] = { x: p.x, y: p.y, z: p.z };

        const t = i / count;
        let cr;
        let cg;
        let cb;

        switch (cm) {
          case 'solid':
            cr = c1.r;
            cg = c1.g;
            cb = c1.b;
            break;
          case 'gradient':
            cr = c1.r + (c2.r - c1.r) * t;
            cg = c1.g + (c2.g - c1.g) * t;
            cb = c1.b + (c2.b - c1.b) * t;
            break;
          case 'rainbow': {
            const rgb = hslToRGB(t, 0.8, 0.6);
            cr = rgb.r;
            cg = rgb.g;
            cb = rgb.b;
            break;
          }
          case 'depth': {
            const ny = (p.y / R + 1) / 2;
            cr = c1.r + (c2.r - c1.r) * ny;
            cg = c1.g + (c2.g - c1.g) * ny;
            cb = c1.b + (c2.b - c1.b) * ny;
            break;
          }
        }

        col[i * 3] = cr;
        col[i * 3 + 1] = cg;
        col[i * 3 + 2] = cb;
        szs[i] = ps * (0.7 + Math.random() * 0.6);
      }

      offset = end;

      if (offset < count) {
        setTimeout(processChunk, 0);
      } else {
        if (buildId !== _buildId) return;

        basePositions = newBase;
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(szs, 1));

        material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uPointSize: { value: ps },
            uOpacity: { value: config.opacity },
            uTexture: { value: createShapeTexture(config.shape) },
            uDepthFade: { value: config.depthFade ? 1 : 0 },
            uSparkle: { value: config.sparkle ? 1 : 0 },
            uSizeAttenuation: { value: config.sizeAttenuation ? 1 : 0 },
            uBlur: { value: 0.0 }
          },
          vertexShader: [
            'attribute float size;',
            'varying vec3 vColor;',
            'varying float vDist;',
            'uniform float uPointSize;',
            'uniform float uSizeAttenuation;',
            'uniform float uBlur;',
            'void main() {',
            '  vColor = color;',
            '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
            '  vDist = -mv.z;',
            '  float fs = size * uPointSize;',
            '  // Blur: enlarge points to create soft overlap',
            '  fs *= (1.0 + uBlur * 3.0);',
            '  gl_PointSize = uSizeAttenuation > 0.5 ? fs * (300.0 / -mv.z) : fs * 5.0;',
            '  gl_Position = projectionMatrix * mv;',
            '}'
          ].join('\n'),
          fragmentShader: [
            'uniform float uOpacity;',
            'uniform float uTime;',
            'uniform float uDepthFade;',
            'uniform float uSparkle;',
            'uniform float uBlur;',
            'uniform sampler2D uTexture;',
            'varying vec3 vColor;',
            'varying float vDist;',
            'float rand(vec2 s) { return fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453); }',
            'void main() {',
            '  vec4 tx = texture2D(uTexture, gl_PointCoord);',
            '  if (tx.a < 0.1) discard;',
            '  float a = uOpacity * tx.a;',
            '  // Blur: fade opacity and soften edges via radial falloff',
            '  if (uBlur > 0.0) {',
            '    float dist = length(gl_PointCoord - vec2(0.5)) * 2.0;',
            '    float softEdge = 1.0 - smoothstep(0.2, 1.0, dist);',
            '    a *= mix(1.0, softEdge * 0.35, uBlur);',
            '  }',
            '  if (uDepthFade > 0.5) {',
            '    a *= mix(0.3, 1.0, smoothstep(15.0, 4.0, vDist));',
            '  }',
            '  if (uSparkle > 0.5) {',
            '    a *= mix(0.5, 1.0, rand(gl_PointCoord + vec2(uTime * 0.01)));',
            '  }',
            '  gl_FragColor = vec4(vColor, a);',
            '}'
          ].join('\n'),
          transparent: true,
          vertexColors: true,
          depthWrite: config.blendMode === 'normal',
          blending: getBlend()
        });

        points = new THREE.Points(geometry, material);
        scene.add(points);
      }
    }

    if (count <= CHUNK) {
      offset = 0;
      processChunk();
    } else {
      processChunk();
    }
  }

  scene.background = new THREE.Color(config.bgColor);
  document.body.style.background = config.bgColor;
  createSphere();

  // ─── Animation Loop ──────────────────────
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let rotX = 0;
  let rotY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let zoom = 10;

  renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.target === renderer.domElement) {
      mouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    targetRotY += (e.clientX - mouseX) * 0.005;
    targetRotX += (e.clientY - mouseY) * 0.005;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const DEFAULT_ZOOM = 10;

  function updateZoomDisplay() {
    const el = document.getElementById('zoomValue');
    if (el) el.textContent = zoom.toFixed(1);
  }

  window.resetZoom = function () {
    zoom = DEFAULT_ZOOM;
    updateZoomDisplay();
  };

  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      zoom += e.deltaY * 0.01;
      zoom = Math.max(3, Math.min(25, zoom));
      updateZoomDisplay();
      e.preventDefault();
    },
    { passive: false }
  );

  updateZoomDisplay();

  const clock = new THREE.Clock();
  let autoAngle = 0;
  let lastTime = 0;

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    const delta = elapsed - lastTime;
    lastTime = elapsed;

    if (material) material.uniforms.uTime.value = elapsed;

    if (isMorphing && morphFrom.length > 0 && geometry && points) {
      morphProgress += delta * config.morphSpeed;
      if (morphProgress >= 1) {
        morphProgress = 1;
        isMorphing = false;
        if (material) material.uniforms.uBlur.value = 0.0;
        renderer.domElement.style.filter = '';
      }

      const ef = getEasing(config.morphEasing);
      const t = ef(Math.min(morphProgress, 1));
      const transFn = getTransition(config.morphTransition);
      const cnt = basePositions.length;
      const R = config.radius;
      const pa = geometry.getAttribute('position');

      // Drive blur for blur transition (0→1→0 bell curve during morph)
      if (config.morphTransition === 'blur') {
        const blurCurve = Math.sin(Math.min(morphProgress, 1) * Math.PI);
        if (material) material.uniforms.uBlur.value = blurCurve;
        // CSS filter blur on top of shader blur for real visual blur
        const cssBlur = blurCurve * 4; // max 4px at midpoint
        renderer.domElement.style.filter = cssBlur > 0.1 ? `blur(${cssBlur.toFixed(1)}px)` : '';
      } else {
        if (material) material.uniforms.uBlur.value = 0.0;
      }

      // Apply transition + layered animation on top
      const animFn = config.animationIntensity > 0 ? PointMorph._animations[config.animationPreset] : null;
      const spd = config.animationSpeed;
      const inten = config.animationIntensity;

      if (pa) {
        for (let i = 0; i < cnt; i++) {
          const f = morphFrom[i];
          const to = morphTo[i];
          if (!f || !to) continue;

          const p = transFn(f, to, t, i, cnt, R);
          basePositions[i] = { x: p.x, y: p.y, z: p.z };

          // Layer animation on top of morph position
          if (animFn) {
            const ap = animFn(p, i, cnt, elapsed, spd, inten, R);
            pa.setXYZ(i, ap.x, ap.y, ap.z);
          } else {
            pa.setXYZ(i, p.x, p.y, p.z);
          }
        }
        pa.needsUpdate = true;
      }
    } else if (config.animationIntensity > 0 && points && geometry) {
      const animFn = PointMorph._animations[config.animationPreset];
      if (animFn) {
        const pa = geometry.getAttribute('position');
        if (pa) {
          const cnt = basePositions.length;
          const spd = config.animationSpeed;
          const inten = config.animationIntensity;
          const R = config.radius;
          for (let i = 0; i < cnt; i++) {
            const b = basePositions[i];
            if (!b) continue;
            const p = animFn(b, i, cnt, elapsed, spd, inten, R);
            pa.setXYZ(i, p.x, p.y, p.z);
          }
          pa.needsUpdate = true;
        }
      }
    }

    if (config.autoRotate) autoAngle += config.orbitSpeed * 0.01;

    rotX += (targetRotX - rotX) * 0.08;
    rotY += (targetRotY - rotY) * 0.08;

    if (points) {
      points.rotation.x = rotX;
      points.rotation.y = rotY + autoAngle;
    }

    camera.position.z += (zoom - camera.position.z) * 0.08;
    renderer.render(scene, camera);

    const statsEl = document.getElementById('stats');
    if (statsEl) {
      statsEl.textContent =
        config.pointCount.toLocaleString() +
        ' points' +
        (isMorphing ? ' · morphing ' + Math.round(morphProgress * 100) + '%' : '');
    }
  }

  animate();

  // ═══════════════════════════════════════════════════
  // UI EVENT LISTENERS & CONTROLS
  // ═══════════════════════════════════════════════════

  // ─── Sliders ──────────────────────────────────────
  let _rebuildTimer = null;
  let _lastRadius = config.radius;

  function bindSlider(id, prop, did, fmt, cb) {
    const e = document.getElementById(id);
    const d = document.getElementById(did);
    e.addEventListener('input', () => {
      config[prop] = parseFloat(e.value);
      d.textContent = fmt(config[prop]);
      if (cb) cb();
      else saveConfig();
    });
  }

  function needsRebuild() {
    // Only invalidate model caches if radius actually changed
    if (config.radius !== _lastRadius) {
      for (const entry of modelLibrary) {
        if (entry._normalizedCache) {
          delete entry._normalizedCache;
          delete entry._neighbors;
        }
      }
      _lastRadius = config.radius;
    }
    // Debounce: coalesce rapid slider drags into one rebuild
    if (_rebuildTimer) cancelAnimationFrame(_rebuildTimer);
    _rebuildTimer = requestAnimationFrame(() => {
      _rebuildTimer = null;
      createSphere();
      saveConfig();
    });
  }

  function updateMat() {
    if (material) {
      material.uniforms.uPointSize.value = config.pointSize;
      material.uniforms.uOpacity.value = config.opacity;
      material.uniforms.uDepthFade.value = config.depthFade ? 1 : 0;
      material.uniforms.uSparkle.value = config.sparkle ? 1 : 0;
      material.uniforms.uSizeAttenuation.value = config.sizeAttenuation ? 1 : 0;
    }
  }

  bindSlider('pointCount', 'pointCount', 'pointCountVal', (v) => v, needsRebuild);
  bindSlider('radius', 'radius', 'radiusVal', (v) => v.toFixed(1), needsRebuild);
  bindSlider('spread', 'spread', 'spreadVal', (v) => v.toFixed(2), needsRebuild);
  bindSlider('pointSize', 'pointSize', 'pointSizeVal', (v) => v.toFixed(1), () => {
    updateMat();
    needsRebuild();
  });
  bindSlider('orbitSpeed', 'orbitSpeed', 'orbitSpeedVal', (v) => v.toFixed(2));
  bindSlider('animationIntensity', 'animationIntensity', 'animationIntensityVal', (v) => v.toFixed(2));
  bindSlider('animationSpeed', 'animationSpeed', 'animationSpeedVal', (v) => v.toFixed(1));
  bindSlider('opacity', 'opacity', 'opacityVal', (v) => v.toFixed(2), updateMat);
  bindSlider('morphSpeed', 'morphSpeed', 'morphSpeedVal', (v) => v.toFixed(1));
  bindSlider('pointDensity', 'pointDensity', 'pointDensityVal', (v) => v.toFixed(1));

  // ─── Checkboxes ────────────────────────────────────
  document.getElementById('autoRotate').addEventListener('change', (e) => {
    config.autoRotate = e.target.checked;
    saveConfig();
  });
  document.getElementById('depthFade').addEventListener('change', (e) => {
    config.depthFade = e.target.checked;
    updateMat();
    saveConfig();
  });
  document.getElementById('sparkle').addEventListener('change', (e) => {
    config.sparkle = e.target.checked;
    updateMat();
    saveConfig();
  });
  document.getElementById('fillVertexGap').addEventListener('change', (e) => {
    config.fillVertexGap = e.target.checked;
    saveConfig();
  });

  // ─── BgColor ───────────────────────────────────────
  document.getElementById('bgColor').addEventListener('input', (e) => {
    config.bgColor = e.target.value;
    scene.background = new THREE.Color(config.bgColor);
    document.body.style.background = config.bgColor;
    saveConfig();
  });

  // ─── Color Mode: Segmented Control + Gradient Presets + Gradient Bar ──────
  const GRAD_PRESETS = [
    ['#a78bfa', '#60a5fa'],
    ['#f472b6', '#fbbf24'],
    ['#34d399', '#3b82f6'],
    ['#f87171', '#fbbf24'],
    ['#818cf8', '#f472b6'],
    ['#06b6d4', '#8b5cf6'],
    ['#fbbf24', '#ef4444'],
    ['#10b981', '#f59e0b'],
    ['#e879f9', '#22d3ee'],
    ['#fb923c', '#a78bfa']
  ];

  // Populate gradient preset strip
  (function() {
    const container = document.getElementById('gradPresets');
    GRAD_PRESETS.forEach(([c1, c2], i) => {
      const el = document.createElement('div');
      el.className = 'grad-preset';
      el.style.background = `linear-gradient(90deg, ${c1}, ${c2})`;
      el.dataset.idx = i;
      container.appendChild(el);
    });
  })();

  function updateGradBarVisual() {
    const c1 = config.pointColor;
    const c2 = config.gradientEnd;
    document.getElementById('gradBarInner').style.background = `linear-gradient(90deg, ${c1}, ${c2})`;
    const s = document.getElementById('gradStopStart');
    const e = document.getElementById('gradStopEnd');
    s.style.background = c1;
    e.style.background = c2;
    document.getElementById('gradColorStart').value = c1;
    document.getElementById('gradColorEnd').value = c2;
    document.getElementById('gradHexStart').textContent = c1;
    document.getElementById('gradHexEnd').textContent = c2;
    // Highlight matching preset
    document.querySelectorAll('.grad-preset').forEach((el, i) => {
      const [pc1, pc2] = GRAD_PRESETS[i];
      el.classList.toggle(
        'active',
        pc1.toLowerCase() === c1.toLowerCase() && pc2.toLowerCase() === c2.toLowerCase()
      );
    });
  }

  function updateColorSectionVisibility() {
    const m = config.colorMode;
    const isGrad = m === 'gradient' || m === 'depth';
    document.getElementById('solidColorRow').style.display = m === 'solid' ? 'flex' : 'none';
    document.getElementById('gradPresetsRow').style.display = isGrad ? 'block' : 'none';
    document.getElementById('gradBarWrap').style.display = isGrad ? 'block' : 'none';
    // Segmented control active state
    document.querySelectorAll('#colorModeControl button').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === m);
    });
    if (isGrad) updateGradBarVisual();
  }

  // Segmented control clicks
  document.getElementById('colorModeControl').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    config.colorMode = btn.dataset.mode;
    document.getElementById('colorMode').value = config.colorMode;
    updateColorSectionVisibility();
    needsRebuild();
  });

  // Solid color picker
  document.getElementById('pointColor').addEventListener('input', (e) => {
    config.pointColor = e.target.value;
    needsRebuild();
  });

  // Gradient start/end color pickers (inside the stops)
  document.getElementById('gradColorStart').addEventListener('input', (e) => {
    config.pointColor = e.target.value;
    updateGradBarVisual();
    needsRebuild();
  });
  document.getElementById('gradColorEnd').addEventListener('input', (e) => {
    config.gradientEnd = e.target.value;
    document.getElementById('gradientEnd').value = config.gradientEnd;
    updateGradBarVisual();
    needsRebuild();
  });

  // Gradient presets click
  document.getElementById('gradPresets').addEventListener('click', (e) => {
    const el = e.target.closest('.grad-preset');
    if (!el) return;
    const [c1, c2] = GRAD_PRESETS[parseInt(el.dataset.idx)];
    config.pointColor = c1;
    config.gradientEnd = c2;
    document.getElementById('pointColor').value = c1;
    document.getElementById('gradientEnd').value = c2;
    updateGradBarVisual();
    needsRebuild();
  });

  // Reverse button
  document.getElementById('gradReverseBtn').addEventListener('click', () => {
    const tmp = config.pointColor;
    config.pointColor = config.gradientEnd;
    config.gradientEnd = tmp;
    document.getElementById('pointColor').value = config.pointColor;
    document.getElementById('gradientEnd').value = config.gradientEnd;
    updateGradBarVisual();
    needsRebuild();
  });

  // Draggable gradient stops
  (function() {
    const bar = document.getElementById('gradBar');
    const stopStart = document.getElementById('gradStopStart');
    const stopEnd = document.getElementById('gradStopEnd');
    let dragging = null;

    function pctFromEvent(e) {
      const rect = bar.getBoundingClientRect();
      return Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    }

    function onDown(which) {
      return function(e) {
        if (e.target.tagName === 'INPUT') return;
        e.preventDefault();
        dragging = which;
        this.classList.add('dragging');
      };
    }
    stopStart.addEventListener('mousedown', onDown('start'));
    stopEnd.addEventListener('mousedown', onDown('end'));

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const pct = pctFromEvent(e);
      if (dragging === 'start') {
        const endPct = parseFloat(stopEnd.style.left);
        if (pct < endPct - 4) stopStart.style.left = pct + '%';
      } else {
        const startPct = parseFloat(stopStart.style.left);
        if (pct > startPct + 4) stopEnd.style.left = pct + '%';
      }
      updateGradBarVisual();
    });
    window.addEventListener('mouseup', () => {
      if (dragging) {
        document.getElementById('gradStop' + (dragging === 'start' ? 'Start' : 'End')).classList.remove('dragging');
        dragging = null;
      }
    });

    // Touch support
    stopStart.addEventListener(
      'touchstart',
      (e) => {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          dragging = 'start';
          stopStart.classList.add('dragging');
        }
      },
      { passive: false }
    );
    stopEnd.addEventListener(
      'touchstart',
      (e) => {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          dragging = 'end';
          stopEnd.classList.add('dragging');
        }
      },
      { passive: false }
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (!dragging) return;
        const t = e.touches[0];
        const rect = bar.getBoundingClientRect();
        const pct = Math.max(2, Math.min(98, ((t.clientX - rect.left) / rect.width) * 100));
        if (dragging === 'start') {
          const ep = parseFloat(stopEnd.style.left);
          if (pct < ep - 4) stopStart.style.left = pct + '%';
        } else {
          const sp = parseFloat(stopStart.style.left);
          if (pct > sp + 4) stopEnd.style.left = pct + '%';
        }
        updateGradBarVisual();
      },
      { passive: true }
    );
    window.addEventListener('touchend', () => {
      if (dragging) {
        document.getElementById('gradStop' + (dragging === 'start' ? 'Start' : 'End')).classList.remove('dragging');
        dragging = null;
      }
    });
  })();

  // Init color section visibility
  updateColorSectionVisibility();

  // ─── Size Attenuation & Blend Mode ────────────────
  document.getElementById('sizeAttenuation').addEventListener('change', (e) => {
    config.sizeAttenuation = e.target.value === 'true';
    updateMat();
    saveConfig();
  });
  document.getElementById('blendMode').addEventListener('change', (e) => {
    config.blendMode = e.target.value;
    needsRebuild();
  });

  // ─── Morph Easing ─────────────────────────────────
  document.getElementById('morphEasing').addEventListener('change', (e) => {
    config.morphEasing = e.target.value;
    const editor = document.getElementById('bezierEditor');
    if (e.target.value === 'custom') {
      editor.classList.add('visible');
      drawBezier();
    } else {
      editor.classList.remove('visible');
    }
    saveConfig();
  });

  // ─── Bezier Curve Editor ──────────────────────────
  (function() {
    const canvas = document.getElementById('bezierCanvas');
    const ctx = canvas.getContext('2d');
    const valEl = document.getElementById('bezierValues');
    const PAD = 40;
    const SIZE = 400;
    let dragging = null;

    function getBez() {
      return config.customBezier;
    }
    function toCanvas(x, y) {
      return [PAD + x * (SIZE - 2 * PAD), SIZE - PAD - y * (SIZE - 2 * PAD)];
    }
    function fromCanvas(cx, cy) {
      return [(cx - PAD) / (SIZE - 2 * PAD), (SIZE - PAD - cy) / (SIZE - 2 * PAD)];
    }

    window.drawBezier = function() {
      const [x1, y1, x2, y2] = getBez();
      const W = SIZE;
      const H = SIZE;
      const area = W - 2 * PAD;
      ctx.clearRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = PAD + (i * area) / 10;
        const y = PAD + (i * area) / 10;
        ctx.beginPath();
        ctx.moveTo(x, PAD);
        ctx.lineTo(x, H - PAD);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PAD, y);
        ctx.lineTo(W - PAD, y);
        ctx.stroke();
      }
      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('TIME', W / 2, H - 8);
      ctx.save();
      ctx.translate(10, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('PROGRESSION', 0, 0);
      ctx.restore();
      // Diagonal reference
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(...toCanvas(0, 0));
      ctx.lineTo(...toCanvas(1, 1));
      ctx.stroke();
      ctx.setLineDash([]);
      // Handle lines
      ctx.strokeStyle = 'rgba(167,139,250,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(...toCanvas(0, 0));
      ctx.lineTo(...toCanvas(x1, y1));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(96,165,250,0.35)';
      ctx.beginPath();
      ctx.moveTo(...toCanvas(1, 1));
      ctx.lineTo(...toCanvas(x2, y2));
      ctx.stroke();
      // Curve
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(...toCanvas(0, 0));
      const steps = 80;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        const bx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
        const by = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
        ctx.lineTo(...toCanvas(bx, by));
      }
      ctx.stroke();
      // Control points
      // P1 - pink/purple
      const [cx1, cy1] = toCanvas(x1, y1);
      ctx.beginPath();
      ctx.arc(cx1, cy1, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#e879a8';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // P2 - cyan/blue
      const [cx2, cy2] = toCanvas(x2, y2);
      ctx.beginPath();
      ctx.arc(cx2, cy2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#67c9e4';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Start/end points
      const [sx, sy] = toCanvas(0, 0);
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      const [ex, ey] = toCanvas(1, 1);
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      // Update values
      valEl.textContent = `cubic-bezier(${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)})`;
      // Update preset buttons
      document.querySelectorAll('#bezierPresets button').forEach((btn) => {
        const vals = btn.dataset.bez.split(',').map(Number);
        const match =
          Math.abs(vals[0] - x1) < 0.01 &&
          Math.abs(vals[1] - y1) < 0.01 &&
          Math.abs(vals[2] - x2) < 0.01 &&
          Math.abs(vals[3] - y2) < 0.01;
        btn.classList.toggle('active', match);
      });
    };

    function getMousePos(e) {
      const r = canvas.getBoundingClientRect();
      const sx = SIZE / r.width;
      const sy = SIZE / r.height;
      return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
    }

    function hitTest(mx, my) {
      const [x1, y1, x2, y2] = getBez();
      const [cx1, cy1] = toCanvas(x1, y1);
      const [cx2, cy2] = toCanvas(x2, y2);
      if (Math.hypot(mx - cx1, my - cy1) < 14) return 'p1';
      if (Math.hypot(mx - cx2, my - cy2) < 14) return 'p2';
      return null;
    }

    canvas.addEventListener('mousedown', (e) => {
      const [mx, my] = getMousePos(e);
      dragging = hitTest(mx, my);
      if (dragging) canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      const [mx, my] = getMousePos(e);
      if (dragging) {
        let [nx, ny] = fromCanvas(mx, my);
        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(-0.5, Math.min(1.5, ny));
        if (dragging === 'p1') {
          config.customBezier[0] = nx;
          config.customBezier[1] = ny;
        } else {
          config.customBezier[2] = nx;
          config.customBezier[3] = ny;
        }
        drawBezier();
        saveConfig();
      } else {
        canvas.style.cursor = hitTest(mx, my) ? 'grab' : 'default';
      }
    });

    canvas.addEventListener('mouseup', () => {
      dragging = null;
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', () => {
      dragging = null;
      canvas.style.cursor = 'default';
    });

    // Touch support
    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        const sx = SIZE / r.width;
        const sy = SIZE / r.height;
        const mx = (t.clientX - r.left) * sx;
        const my = (t.clientY - r.top) * sy;
        dragging = hitTest(mx, my);
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        if (!dragging) return;
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        const sx = SIZE / r.width;
        const sy = SIZE / r.height;
        const mx = (t.clientX - r.left) * sx;
        const my = (t.clientY - r.top) * sy;
        let [nx, ny] = fromCanvas(mx, my);
        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(-0.5, Math.min(1.5, ny));
        if (dragging === 'p1') {
          config.customBezier[0] = nx;
          config.customBezier[1] = ny;
        } else {
          config.customBezier[2] = nx;
          config.customBezier[3] = ny;
        }
        drawBezier();
        saveConfig();
      },
      { passive: false }
    );

    canvas.addEventListener('touchend', () => {
      dragging = null;
    });

    // Presets
    document.getElementById('bezierPresets').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const vals = btn.dataset.bez.split(',').map(Number);
      config.customBezier = [vals[0], vals[1], vals[2], vals[3]];
      drawBezier();
      saveConfig();
    });

    // Init: show editor if custom is already selected
    if (config.morphEasing === 'custom') {
      document.getElementById('bezierEditor').classList.add('visible');
      setTimeout(drawBezier, 100);
    }
  })();

  // ─── Shape Control ────────────────────────────────
  window.setShape = function(s, btn) {
    config.shape = s;
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (material) {
      material.uniforms.uTexture.value.dispose();
      material.uniforms.uTexture.value = createShapeTexture(s);
    }
    saveConfig();
  };

  // ─── Animation Preset Selector ─────────────────────
  window.setAnimPreset = function(preset, btn) {
    config.animationPreset = preset;
    document.querySelectorAll('.anim-preset-btn').forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    saveConfig();
  };

  // ─── Transition Strip ──────────────────────────────
  document.getElementById('transStrip').addEventListener('click', (e) => {
    const btn = e.target.closest('.trans-btn');
    if (!btn) return;
    config.morphTransition = btn.dataset.trans;
    document.querySelectorAll('.trans-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    saveConfig();
  });

  // ─── Panel Toggle Functions ────────────────────────
  let leftVisible = true;
  let rightVisible = true;

  window.toggleLeftPanel = function() {
    leftVisible = !leftVisible;
    document.getElementById('leftPanel').classList.toggle('hidden-left', !leftVisible);
    document.getElementById('toggleLeft').classList.toggle('active', leftVisible);
  };

  window.toggleRightPanel = function() {
    rightVisible = !rightVisible;
    document.getElementById('rightPanel').classList.toggle('hidden-right', !rightVisible);
    document.getElementById('toggleRight').classList.toggle('active', rightVisible);
  };

  // ═══════════════════════════════════════════════════
  // 3D MODEL LIBRARY SYSTEM (GLTF/GLB/OBJ)
  // ═══════════════════════════════════════════════════

  async function loadModelFiles(fileList) {
    const files = Array.from(fileList);

    // Separate main model files from companion resources (.bin)
    const companions = {};
    const companionBlobs = [];
    const mainFiles = [];

    for (const f of files) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (ext === 'bin') {
        const blobURL = URL.createObjectURL(f);
        companions[f.name] = blobURL;
        companionBlobs.push(blobURL);
      } else if (['glb', 'gltf', 'obj'].includes(ext)) {
        mainFiles.push(f);
      }
    }

    if (mainFiles.length === 0) {
      companionBlobs.forEach((u) => URL.revokeObjectURL(u));
      if (files.length > 0) alert('Please upload a .glb, .gltf, or .obj file');
      return;
    }

    for (const file of mainFiles) {
      await loadSingleModel(file, companions);
    }

    companionBlobs.forEach((u) => URL.revokeObjectURL(u));
  }

  async function loadSingleModel(file, companions) {
    const ext = file.name.split('.').pop().toLowerCase();
    const name = file.name.replace(/\.[^.]+$/, '');

    // Upload to server first
    let serverResult = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResp = await fetch('/api/upload-model', { method: 'POST', body: formData });
      if (uploadResp.ok) {
        serverResult = await uploadResp.json();
      }
    } catch (e) {
      console.warn('Server upload skipped:', e.message);
    }

    const modelId = serverResult ? serverResult.id : 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Store file blob
    const fileBlob = file.slice();
    const companionBlobs = {};
    if (ext === 'gltf') {
      for (const [cName, cURL] of Object.entries(companions)) {
        try {
          const resp = await fetch(cURL);
          companionBlobs[cName] = await resp.blob();
        } catch (e) {}
      }
    }

    // Add to library
    const entry = {
      id: modelId,
      name,
      fileBlob,
      companionBlobs,
      format: ext,
      vertexCount: 0,
      vertices: null,
      loading: true,
      _isManifest: !!serverResult
    };
    modelLibrary.push(entry);
    renderModelLibrary();

    try {
      let rawVertices;

      if (ext === 'obj') {
        const text = await file.text();
        rawVertices = parseOBJVertices(text);
      } else if (ext === 'glb') {
        const arrayBuffer = await file.arrayBuffer();
        const gltf = await new Promise((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.parse(arrayBuffer, '', resolve, reject);
        });
        rawVertices = extractGLTFVertices(gltf);
        disposeGLTFScene(gltf);
      } else {
        // .gltf
        const manager = new THREE.LoadingManager();
        const tempBlobURLs = {};
        for (const [cName, cURL] of Object.entries(companions)) {
          tempBlobURLs[cName] = cURL;
        }
        manager.setURLModifier((url) => {
          const fn = url.split('/').pop().split('?')[0];
          return tempBlobURLs[fn] || url;
        });
        const gltfLoader = new GLTFLoader(manager);
        const mainBlobURL = URL.createObjectURL(file);
        try {
          const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load(mainBlobURL, resolve, undefined, reject);
          });
          rawVertices = extractGLTFVertices(gltf);
          disposeGLTFScene(gltf);
        } finally {
          URL.revokeObjectURL(mainBlobURL);
        }
      }

      if (rawVertices.length === 0) throw new Error('No vertices found in model');

      entry.vertexCount = rawVertices.length / 3;
      entry.loading = false;
      entry._rawVertices = rawVertices;

      renderModelLibrary();
      addModelToMorphGrid(entry);
    } catch (err) {
      console.error('Model load error:', err);
      const idx = modelLibrary.indexOf(entry);
      if (idx !== -1) modelLibrary.splice(idx, 1);
      renderModelLibrary();
      alert('Failed to load model: ' + err.message);
    }
  }

  function disposeGLTFScene(gltf) {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      }
    });
  }

  // Add model as morph button in grid
  function addModelToMorphGrid(entry) {
    const grid = document.getElementById('morphGrid');
    const btn = document.createElement('button');
    btn.className = 'morph-btn';
    btn.dataset.morph = entry.id;
    btn.innerHTML = `<div class="icon" style="font-size:11px;">&#9653;</div>${entry.name.slice(0, 8)}`;
    btn.onclick = () => morphToModel(entry.id);
    grid.appendChild(btn);
  }

  // Render model library list
  function renderModelLibrary() {
    const container = document.getElementById('modelLibrary');
    const emptyMsg = document.getElementById('modelEmptyMsg');

    container.querySelectorAll('.model-item').forEach((el) => el.remove());

    if (modelLibrary.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }

    emptyMsg.style.display = 'none';

    for (const entry of modelLibrary) {
      const item = document.createElement('div');
      item.className = 'model-item' + (config.morphTarget === entry.id ? ' active' : '');
      item.innerHTML = `
        <div class="mi-icon">&#9653;</div>
        <div class="mi-info">
          <div class="mi-name">${entry.name}.${entry.format}</div>
          <div class="mi-meta">${entry.loading ? 'Loading...' : entry.vertexCount.toLocaleString() + ' vertices'}</div>
        </div>
        <div class="mi-actions">
          <button class="mi-btn" title="Morph to this model" data-action="morph" data-id="${entry.id}">&#9654;</button>
          <button class="mi-btn danger" title="Remove" data-action="remove" data-id="${entry.id}">&#10005;</button>
        </div>
      `;
      item.querySelector('[data-action="morph"]').addEventListener('click', (e) => {
        e.stopPropagation();
        morphToModel(entry.id);
        renderModelLibrary();
      });
      item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removeModel(entry.id);
      });
      item.addEventListener('click', () => {
        morphToModel(entry.id);
        renderModelLibrary();
      });
      container.appendChild(item);
    }
  }

  // Model upload handlers
  const modelUploadZone = document.getElementById('modelUploadZone');
  const modelInput = document.getElementById('modelInput');

  modelInput.addEventListener('change', (e) => {
    if (e.target.files.length) loadModelFiles(e.target.files);
    e.target.value = '';
  });
  modelUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    modelUploadZone.classList.add('dragover');
  });
  modelUploadZone.addEventListener('dragleave', () => modelUploadZone.classList.remove('dragover'));
  modelUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    modelUploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) loadModelFiles(e.dataTransfer.files);
  });

  // ─── Auto-load Models from Manifest ─────────────────
  async function loadManifestModels() {
    try {
      const resp = await fetch('/models/manifest.json');
      if (!resp.ok) return;
      const manifest = await resp.json();
      if (!manifest || manifest.length === 0) return;

      for (const item of manifest) {
        if (modelLibrary.find(m => m.id === item.id)) continue;

        const modelId = item.id;
        const name = item.label || item.id;
        const format = item.format;
        const filePath = '/models/' + item.file;

        const entry = {
          id: modelId,
          name: name,
          fileBlob: null,
          companionBlobs: {},
          format: format,
          vertexCount: 0,
          vertices: null,
          loading: true,
          _isManifest: true
        };

        modelLibrary.push(entry);
        renderModelLibrary();

        try {
          const fileResp = await fetch(filePath);
          if (!fileResp.ok) throw new Error('HTTP ' + fileResp.status);
          const arrayBuffer = await fileResp.arrayBuffer();
          entry.fileBlob = new Blob([arrayBuffer]);

          let rawVertices;
          if (format === 'obj') {
            rawVertices = parseOBJVertices(await entry.fileBlob.text());
          } else if (format === 'glb') {
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
              loader.parse(arrayBuffer, '', resolve, reject);
            });
            rawVertices = extractGLTFVertices(gltf);
            disposeGLTFScene(gltf);
          } else if (format === 'gltf') {
            const loader = new GLTFLoader();
            const blobURL = URL.createObjectURL(entry.fileBlob);
            try {
              const gltf = await new Promise((resolve, reject) => {
                loader.load(blobURL, resolve, undefined, reject);
              });
              rawVertices = extractGLTFVertices(gltf);
              disposeGLTFScene(gltf);
            } finally {
              URL.revokeObjectURL(blobURL);
            }
          } else {
            throw new Error('Unsupported format: ' + format);
          }

          if (!rawVertices || rawVertices.length === 0) throw new Error('No vertices found');

          entry.vertexCount = rawVertices.length / 3;
          entry._rawVertices = rawVertices;
          entry.loading = false;

          renderModelLibrary();
          addModelToMorphGrid(entry);
        } catch (err) {
          console.warn('Manifest model "' + name + '" failed:', err.message);
          const idx = modelLibrary.indexOf(entry);
          if (idx !== -1) modelLibrary.splice(idx, 1);
          renderModelLibrary();
        }
      }
    } catch (e) {
      console.warn('Failed to load manifest:', e.message);
    }
  }

  // Load manifest models on startup
  loadManifestModels();

  // ─── Morphing Functions ───────────────────────────
  async function morphToModel(modelId) {
    const entry = modelLibrary.find((m) => m.id === modelId);
    if (!entry) return;

    config.morphTarget = modelId;
    document.querySelectorAll('.morph-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.querySelector(`.morph-btn[data-morph="${modelId}"]`);
    if (btn) btn.classList.add('active');

    const count = config.pointCount;
    morphFrom = basePositions.map((p) => ({ ...p }));
    morphTo = [];

    if (!entry._normalizedCache) {
      if (entry._rawVertices) {
        entry._normalizedCache = normalizeVertices(entry._rawVertices, config.radius);
      }
    }

    // pointDensity: oversample from model then map to pointCount
    const modelCount = entry._normalizedCache ? entry._normalizedCache.length / 3 : 0;
    const sampleCount = Math.max(count, Math.round(modelCount * (config.pointDensity || 1)));
    const sampled = [];
    for (let i = 0; i < sampleCount; i++) {
      sampled.push(genModelMorphTarget(entry, i, sampleCount, config.radius));
    }

    for (let i = 0; i < count; i++) {
      const p = { ...sampled[i % sampled.length] };
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
      const so = (Math.random() - 0.5) * 2 * config.spread;
      p.x += (p.x / len) * so;
      p.y += (p.y / len) * so;
      p.z += (p.z / len) * so;
      morphTo.push(p);
    }

    morphProgress = 0;
    isMorphing = true;
    saveConfig();
  }

  function morphToDefault() {
    config.morphTarget = 'default';
    document.querySelectorAll('.morph-btn').forEach((b) => b.classList.remove('active'));

    const count = config.pointCount;
    morphFrom = basePositions.map((p) => ({ ...p }));
    morphTo = [];

    const R = config.radius;
    for (let i = 0; i < count; i++) {
      const p = genMorphTarget('default', i, count, R);
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
      const so = (Math.random() - 0.5) * 2 * config.spread;
      p.x += (p.x / len) * so;
      p.y += (p.y / len) * so;
      p.z += (p.z / len) * so;
      morphTo.push(p);
    }

    morphProgress = 0;
    isMorphing = true;
    saveConfig();
  }

  // Remove model from library
  async function removeModel(modelId) {
    const idx = modelLibrary.findIndex((m) => m.id === modelId);
    if (idx === -1) return;
    const entry = modelLibrary[idx];

    try {
      await fetch('/api/delete-model/' + encodeURIComponent(modelId), { method: 'DELETE' });
    } catch (e) {
      console.warn('Server delete skipped:', e.message);
    }

    delete entry.fileBlob;
    delete entry.companionBlobs;
    delete entry._rawVertices;
    delete entry._normalizedCache;

    modelLibrary.splice(idx, 1);

    const btn = document.querySelector(`.morph-btn[data-morph="${modelId}"]`);
    if (btn) btn.remove();

    if (config.morphTarget === modelId) {
      morphToDefault();
    }

    renderModelLibrary();
  }

  // ═══════════════════════════════════════════════════
  // EXPORT SYSTEM — Config JSON
  // ═══════════════════════════════════════════════════

  function getConfigJSON() {
    const exportConfig = {
      pointCount: config.pointCount,
      radius: config.radius,
      spread: config.spread,
      pointSize: config.pointSize,
      form: config.morphTarget,
      shape: config.shape,
      colorMode: config.colorMode,
      pointColor: config.pointColor,
      gradientEnd: config.gradientEnd,
      opacity: config.opacity,
      bgColor: config.bgColor,
      blendMode: config.blendMode,
      orbitSpeed: config.orbitSpeed,
      animationPreset: config.animationPreset,
      animationIntensity: config.animationIntensity,
      animationSpeed: config.animationSpeed,
      autoRotate: config.autoRotate,
      morphSpeed: config.morphSpeed,
      morphEasing: config.morphEasing,
      morphTransition: config.morphTransition,
      sizeAttenuation: config.sizeAttenuation,
      depthFade: config.depthFade,
      sparkle: config.sparkle,
      fillVertexGap: config.fillVertexGap,
      pointDensity: config.pointDensity
    };
    if (config.morphEasing === 'custom') {
      exportConfig.customBezier = config.customBezier;
    }
    return JSON.stringify(exportConfig, null, 2);
  }

  window.getSnippet = function() {
    return getConfigJSON();
  };

  window.openExportModal = function() {
    const modal = document.getElementById('exportModal');
    document.getElementById('snippetContent').textContent = getConfigJSON();
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('visible'));
  };

  window.closeExportModal = function(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('exportModal');
    modal.classList.remove('visible');
    setTimeout(() => (modal.style.display = 'none'), 250);
  };

  window.copySnippet = function() {
    const text = getConfigJSON();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const t = document.getElementById('copyToast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
      })
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const t = document.getElementById('copyToast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
      });
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeExportModal();
  });

  // ─── Sync UI to Config ────────────────────────────
  function syncUIToConfig() {
    // Sliders
    const sliders = {
      pointCount: [(v) => v],
      radius: [(v) => v.toFixed(1)],
      spread: [(v) => v.toFixed(2)],
      pointSize: [(v) => v.toFixed(1)],
      orbitSpeed: [(v) => v.toFixed(2)],
      animationIntensity: [(v) => v.toFixed(2)],
      animationSpeed: [(v) => v.toFixed(1)],
      opacity: [(v) => v.toFixed(2)],
      morphSpeed: [(v) => v.toFixed(1)],
      pointDensity: [(v) => v.toFixed(1)]
    };
    for (const [id, [fmt]] of Object.entries(sliders)) {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + 'Val');
      if (el && config[id] !== undefined) {
        el.value = config[id];
        if (valEl) valEl.textContent = fmt(config[id]);
      }
    }
    // Checkboxes
    document.getElementById('autoRotate').checked = config.autoRotate;
    document.getElementById('depthFade').checked = config.depthFade;
    document.getElementById('sparkle').checked = config.sparkle;
    document.getElementById('fillVertexGap').checked = config.fillVertexGap;
    // Color inputs
    document.getElementById('pointColor').value = config.pointColor;
    document.getElementById('gradientEnd').value = config.gradientEnd;
    document.getElementById('bgColor').value = config.bgColor;
    // Selects
    document.getElementById('colorMode').value = config.colorMode;
    document.getElementById('blendMode').value = config.blendMode;
    document.getElementById('sizeAttenuation').value = String(config.sizeAttenuation);
    document.getElementById('morphEasing').value = config.morphEasing;
    // Bezier editor visibility
    if (config.morphEasing === 'custom') {
      document.getElementById('bezierEditor').classList.add('visible');
    } else {
      document.getElementById('bezierEditor').classList.remove('visible');
    }
    // Transition buttons
    document.querySelectorAll('.trans-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.trans === config.morphTransition);
    });
    // Color section: segmented control + gradient bar
    if (typeof updateColorSectionVisibility === 'function') updateColorSectionVisibility();
    // Shape buttons
    document.querySelectorAll('.preset-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.shape === config.shape);
    });
    // Animation preset buttons
    document.querySelectorAll('.anim-preset-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.anim === config.animationPreset);
    });
  }

  syncUIToConfig();

  // Handle window resize
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onWindowResize);

  // Cleanup function
  return function cleanup() {
    window.removeEventListener('resize', onWindowResize);
    renderer.domElement.removeEventListener('mousedown', () => {});
    window.removeEventListener('mouseup', () => {});
    window.removeEventListener('mousemove', () => {});
    renderer.domElement.removeEventListener('wheel', () => {});

    if (geometry) geometry.dispose();
    if (material) material.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };
}
